# Image Validation & Spam Filtering Logic

This document explains how the system validates images and filters out spam/irrelevant submissions.

## Three-Layer Validation

### Layer 1: Infrastructure Check
**Question:** Is this a civic infrastructure image?

**Rejects:**
- Indoor scenes (offices, homes, rooms)
- Personal items (laptops, phones, food, people, pets)
- Nature/landscapes without infrastructure
- Random/unrelated content

**Example rejections:**
- ❌ Photo of a laptop → "None"
- ❌ Selfie in a car → "None"
- ❌ Picture of food → "None"
- ❌ Forest with no roads → "None"

### Layer 2: Damage Detection
**Question:** Is there ACTUAL damage/issue present?

**Per category validation:**

#### Road Crack
- ✅ **Accept:** Visible cracks, potholes, holes, severe road damage
- ❌ **Reject:** Clean, normal, well-maintained roads → "None"

#### Sidewalk Crack
- ✅ **Accept:** Visible cracks, breaks, uneven sidewalk surfaces
- ❌ **Reject:** Normal, intact sidewalks → "None"

#### Graffiti
- ✅ **Accept:** Spray paint, vandalism, unauthorized markings clearly visible
- ❌ **Reject:** Clean walls, normal surfaces → "None"

#### Overflowing Trash
- ✅ **Accept:** Trash bin visibly full, overflowing, trash spilling out
- ❌ **Reject:** Normal/empty bins, no trash visible → "None"

#### Faded Street Markings
- ✅ **Accept:** Crosswalk/lane markings clearly faded, worn, barely visible
- ❌ **Reject:** Clear, visible markings → "None"

#### Broken Street Light
- ✅ **Accept:** Light post damaged, broken, tilted, clearly non-functional
- ❌ **Reject:** Normal street lights → "None"

#### Fallen Tree
- ✅ **Accept:** Tree or large branch BLOCKING road/sidewalk, fallen across path
- ❌ **Reject:** Standing trees, normal landscaping → "None"

### Layer 3: Confidence Threshold
**Question:** How confident is the AI in its detection?

**Threshold:** 0.6 (configurable via `CONFIDENCE_THRESHOLD` in `.env`)

- If confidence < 0.6 → Convert to "None" (reject)
- If confidence >= 0.6 → Accept the detection

**Why this matters:**
- Better to reject uncertain detections than report false positives
- Users trust the system more when it's accurate
- Prevents spam from overwhelming city departments

## Example Scenarios

### Scenario 1: Normal Road
**Input:** Photo of a clean, well-maintained road
**Layer 1:** ✅ Pass (it's infrastructure)
**Layer 2:** ❌ Fail (no damage visible)
**Result:** `category: "None"`, `status: "rejected"`

### Scenario 2: Laptop Photo
**Input:** Photo of a laptop on a desk
**Layer 1:** ❌ Fail (not infrastructure)
**Result:** `category: "None"`, `status: "rejected"`

### Scenario 3: Real Pothole
**Input:** Photo of a large pothole in a road
**Layer 1:** ✅ Pass (it's infrastructure)
**Layer 2:** ✅ Pass (damage visible)
**Layer 3:** ✅ Pass (confidence: 0.87)
**Result:** `category: "Road Crack"`, `status: "analyzed"`

### Scenario 4: Unclear Image
**Input:** Blurry photo that might show a crack
**Layer 1:** ✅ Pass (looks like infrastructure)
**Layer 2:** ✅ Pass (model thinks it sees damage)
**Layer 3:** ❌ Fail (confidence: 0.45 < 0.6)
**Result:** `category: "None"`, `status: "rejected"`

### Scenario 5: Standing Tree
**Input:** Photo of a healthy tree next to a sidewalk
**Layer 1:** ✅ Pass (infrastructure present)
**Layer 2:** ❌ Fail (tree is standing, not fallen/blocking)
**Result:** `category: "None"`, `status: "rejected"`

## Response Format

### Rejected Image
```json
{
  "tracking_id": "REPORT-ABC123",
  "status": "rejected",
  "message": "Image rejected: This shows a normal, undamaged road with no visible issues.",
  "issue_type": null,
  "confidence": 0.0
}
```

### Accepted Image
```json
{
  "tracking_id": "REPORT-XYZ789",
  "status": "analyzed",
  "message": "Issue detected: Road Crack. Large pothole visible in the road surface near the curb.",
  "issue_type": "Road Crack",
  "confidence": 0.87
}
```

## Configuration

### Adjust Strictness

Edit `.env` to change the confidence threshold:

```bash
# More lenient (accepts more images, may have false positives)
CONFIDENCE_THRESHOLD=0.5

# Balanced (recommended)
CONFIDENCE_THRESHOLD=0.6

# Very strict (fewer false positives, may miss some real issues)
CONFIDENCE_THRESHOLD=0.7
```

## Prompt Engineering

The system uses a detailed prompt with:
1. **Step-by-step instructions** for the AI
2. **Explicit examples** of what to accept/reject
3. **Clear definitions** of each issue category
4. **Checkmarks** (✓/✗) to make requirements obvious

This ensures the AI understands the strict validation requirements.

## Why This Approach?

### Single API Call
- Fast (one call instead of two)
- Cost-effective
- Still very accurate with good prompting

### Strict Validation
- Reduces false positives
- Prevents spam/trolling
- Builds user trust
- Saves city resources

### Confidence Threshold
- Extra safety layer
- Catches uncertain detections
- Configurable based on your needs

## Testing Tips

Test with various images:
- ✅ Real potholes → Should detect
- ✅ Broken street lights → Should detect
- ❌ Normal roads → Should reject
- ❌ Your laptop → Should reject
- ❌ Standing trees → Should reject
- ❌ Empty trash bins → Should reject

Watch the logs to see which layer caught the rejection!
