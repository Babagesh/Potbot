# AI Decision Tree Structure - Complete Implementation ✅

## Overview

The Groq Vision AI model now uses a **structured decision tree** to analyze civic infrastructure images and generate form-ready fields. The AI follows these exact steps:

1. **Filter** - Is this a civic infrastructure issue?
2. **Categorize** - Which category (Road, Sidewalk, Graffiti, Tree)?
3. **Select** - Choose from exact dropdown options for that category
4. **Generate** - Return JSON with form-ready fields

---

## Decision Tree Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: FILTER NON-CIVIC ISSUES                            │
│ ✗ Indoor scenes → "None"                                   │
│ ✗ Personal items → "None"                                  │
│ ✗ Nature without infrastructure → "None"                   │
│ ✗ Normal/undamaged infrastructure → "None"                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: IDENTIFY CATEGORY                                  │
│ A) Road/Street Damage → "Road Crack"                       │
│ B) Sidewalk/Curb Damage → "Sidewalk Crack"                 │
│ C) Graffiti/Vandalism → "Graffiti"                         │
│ D) Tree Issues → "Fallen Tree"                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: SELECT FROM EXACT DROPDOWN OPTIONS                 │
│ (See category-specific decision trees below)               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: RETURN JSON WITH FORM-READY FIELDS                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Category A: Road/Street Damage

### Decision Tree:
```
Image shows road/pavement damage
  ↓
Set fixed fields:
  • damageType = "pothole"
  • issueType = "Street"
  ↓
Choose requestType from 5 options:
  1. "Pothole/Pavement Defect" ← MOST COMMON
  2. "Construction Plate Shifted"
  3. "Manhole Cover Off"
  4. "Utility Excavation"
  5. "Other"
```

### Available Dropdown Options:

**requestType** (5 options):
1. ✅ **"Pothole/Pavement Defect"** - Holes, potholes, pavement damage
2. ⚠️ **"Construction Plate Shifted"** - Metal plates out of place
3. ⚠️ **"Manhole Cover Off"** - Missing or displaced manhole cover
4. ⚠️ **"Utility Excavation"** - Utility work damage
5. ⚠️ **"Other"** - Doesn't fit above categories

**Most Common:** `"Pothole/Pavement Defect"`

### Example Output:
```json
{
  "category": "Road Crack",
  "formFields": {
    "damageType": "pothole",
    "issueType": "Street",
    "requestType": "Pothole/Pavement Defect",
    "requestDescription": "Large pothole in center of right lane..."
  }
}
```

---

## Category B: Sidewalk/Curb Damage

### Decision Tree:
```
Image shows sidewalk/curb damage
  ↓
Set fixed fields:
  • damageType = "sidewalk"
  • issueType = "Sidewalk/Curb"
  ↓
Choose requestType from 6 options:
  1. "Sidewalk Defect" ← MOST COMMON
  2. "Curb or Curb Ramp Defect"
  3. "Missing Side Sewer Vent Cover"
  4. "Damaged Side Sewer Vent Cover"
  5. "Public Stairway Defect"
  6. "Pothole/Pavement Defect"
  ↓
IF requestType = "Sidewalk Defect":
  Choose secondaryRequestType:
    • "Collapsed sidewalk"
    • "Lifted sidewalk"
    • "Cracked sidewalk"
    • Options with "tree roots"
```

### Available Dropdown Options:

**requestType** (6 options):
1. ✅ **"Sidewalk Defect"** - Cracks, breaks, surface damage (MOST COMMON)
2. ⚠️ **"Curb or Curb Ramp Defect"** - Damaged curbs or ramps
3. ⚠️ **"Missing Side Sewer Vent Cover"** - Missing vent cover
4. ⚠️ **"Damaged Side Sewer Vent Cover"** - Broken vent cover
5. ⚠️ **"Public Stairway Defect"** - Damaged stairs
6. ⚠️ **"Pothole/Pavement Defect"** - Pothole in pedestrian area

**Most Common:** `"Sidewalk Defect"`

**secondaryRequestType** (Only if requestType = "Sidewalk Defect"):
- **"Collapsed sidewalk"** - Sidewalk has sunken/collapsed
- **"Lifted sidewalk"** - Sidewalk raised/uneven (often tree roots)
- **"Cracked sidewalk"** - Visible cracks but surface still level
- Options containing **"tree roots"** - If tree damage visible

### Example Output:
```json
{
  "category": "Sidewalk Crack",
  "formFields": {
    "damageType": "sidewalk",
    "issueType": "Sidewalk/Curb",
    "requestType": "Sidewalk Defect",
    "secondaryRequestType": "Lifted sidewalk",
    "requestDescription": "Sidewalk lifted by tree roots..."
  }
}
```

---

## Category C: Graffiti

### Decision Tree:
```
Image shows graffiti/vandalism
  ↓
Determine property type:
  • Private property (buildings)
  • Public property (poles, bridges, etc.)
  • Illegal postings
  ↓
┌─────────────────────────────────────────────────────────────┐
│ IF PRIVATE PROPERTY:                                        │
│   issueType = "Graffiti on Private Property"               │
│   ↓                                                          │
│   Choose requestRegarding (2 options):                      │
│     1. "Not Offensive (no racial slurs or profanity)"      │
│     2. "Offensive (racial slurs or profanity)"             │
│   ↓                                                          │
│   Choose requestType (4 options):                           │
│     1. "Building - Commercial"                              │
│     2. "Building - Residential"                             │
│     3. "Building - Other"                                   │
│     4. "Sidewalk in front of property"                      │
└─────────────────────────────────────────────────────────────┘
                          OR
┌─────────────────────────────────────────────────────────────┐
│ IF PUBLIC PROPERTY:                                         │
│   issueType = "Graffiti on Public Property"                │
│   ↓                                                          │
│   Choose requestRegarding (2 options):                      │
│     1. "Not Offensive (no racial slurs or profanity)"      │
│     2. "Offensive (racial slurs or profanity)"             │
│   ↓                                                          │
│   Choose requestType (17 options):                          │
│     1. "Pole" ← MOST COMMON                                │
│     2. "Bridge"                                             │
│     3. "Street"                                             │
│     4. "Sidewalk structure"                                 │
│     5-17. [12 more options...]                             │
└─────────────────────────────────────────────────────────────┘
                          OR
┌─────────────────────────────────────────────────────────────┐
│ IF ILLEGAL POSTINGS:                                        │
│   issueType = "Illegal Postings on Public Property"        │
│   requestType = "Pole"                                      │
│   ↓                                                          │
│   Choose requestRegarding (9 options):                      │
│     1. "Multiple Postings"                                  │
│     2. "Affixed Improperly"                                 │
│     3-9. [7 more violation types...]                       │
└─────────────────────────────────────────────────────────────┘
```

### Available Dropdown Options:

#### C1: Graffiti on Private Property

**requestRegarding** (2 options):
1. ✅ **"Not Offensive (no racial slurs or profanity)"** - MOST COMMON
2. ⚠️ **"Offensive (racial slurs or profanity)"** - Contains hate speech

**requestType** (4 options):
1. ✅ **"Building - Commercial"** - Stores, offices, businesses
2. **"Building - Residential"** - Homes, apartments
3. **"Building - Other"** - Other private structures
4. **"Sidewalk in front of property"** - Sidewalk adjacent to building

#### C2: Graffiti on Public Property

**requestRegarding** (2 options):
1. ✅ **"Not Offensive (no racial slurs or profanity)"** - MOST COMMON
2. ⚠️ **"Offensive (racial slurs or profanity)"** - Contains hate speech

**requestType** (17 options):
1. ✅ **"Pole"** - Utility poles, light poles (MOST COMMON)
2. **"Bridge"** - Bridge structures
3. **"Street"** - Street surface/pavement
4. **"Sidewalk structure"** - Sidewalk surface
5. **"Signal box"** - Traffic signal boxes
6. **"Transit Shelter/ Platform"** - Bus stops, transit areas
7. **"City receptacle"** - Trash cans, public bins
8. **"Bike rack"** - Bicycle parking
9. **"Fire hydrant"** - Hydrants
10. **"Fire/ Police Call Box"** - Emergency boxes
11. **"Mail box"** - Postal boxes
12. **"News rack"** - Newspaper stands
13. **"Parking meter"** - Parking meters
14. **"Pay phone"** - Payphones
15. **"Sign - Parking and Traffic"** - Traffic signs
16. **"ATT Property"** - AT&T infrastructure
17. **"Other - enter additional details"** - Doesn't fit above

#### C3: Illegal Postings on Public Property

**Fixed fields:**
- issueType = "Illegal Postings on Public Property"
- requestType = "Pole"

**requestRegarding** (9 options):
1. **"Multiple Postings"** - Multiple flyers/posters
2. **"Affixed Improperly"** - Improperly attached
3. **"No Posting Date"** - Missing date
4. **"Posted Over 70 Days"** - Old posting
5. **"Posting Too Large in Size"** - Oversized
6. **"Posting Too High on Pole"** - Too high
7. **"Posted on Traffic Light"** - On traffic signals
8. **"Posted on Historic Street Light"** - On historic lights
9. **"Posted on Directional Sign"** - On directional signs

### Example Outputs:

**Private Property Graffiti:**
```json
{
  "category": "Graffiti",
  "formFields": {
    "issueType": "Graffiti on Private Property",
    "requestRegarding": "Not Offensive (no racial slurs or profanity)",
    "requestType": "Building - Commercial",
    "requestDescription": "Spray-painted tags on exterior wall..."
  }
}
```

**Public Property Graffiti:**
```json
{
  "category": "Graffiti",
  "formFields": {
    "issueType": "Graffiti on Public Property",
    "requestRegarding": "Not Offensive (no racial slurs or profanity)",
    "requestType": "Pole",
    "requestDescription": "Graffiti on utility pole..."
  }
}
```

---

## Category D: Tree Issues

### Decision Tree:
```
Image shows tree issue
  ↓
Determine tree problem type:
  D1. Damaged Tree
  D2. Damaging Property
  D3. Landscaping
  D4. Overgrown Tree
  D5. Other
  ↓
Set requestRegarding based on problem type
  ↓
Choose requestType from category-specific options:
  • D1: 7 options (Fallen tree, Hanging limb, etc.)
  • D2: 5 options (Lifted sidewalk, Property damage, etc.)
  • D3: 12 options (Weeding, Remove suckers, etc.)
  • D4: 7 options (Pruning, Blocking sidewalk, etc.)
  • D5: 1 option (N/A)
```

### Available Dropdown Options:

#### D1: Damaged Tree

**Fixed field:** requestRegarding = "Damaged Tree"

**requestType** (7 options):
1. ✅ **"Fallen tree"** - Tree has fallen (MOST COMMON)
2. **"Hanging limb"** - Limb hanging dangerously
3. **"About to fall"** - Tree leaning/unstable
4. **"Dead tree"** - Dead tree standing
5. **"Damaged Tree"** - General damage
6. **"Vandalized Tree"** - Intentional damage
7. **"Other - Enter Details"** - Other damage

#### D2: Tree Damaging Property

**Fixed field:** requestRegarding = "Damaging Property"

**requestType** (5 options):
1. ✅ **"Lifted sidewalk - tree roots"** - Roots lifting sidewalk (MOST COMMON)
2. **"Hitting window or building"** - Branches hitting structure
3. **"Property damage"** - General property damage
4. **"Sewer damage - tree roots"** - Roots damaging sewer
5. **"Other - Enter Details"** - Other property damage

#### D3: Tree Landscaping Issues

**Fixed field:** requestRegarding = "Landscaping"

**requestType** (12 options):
1. **"Weeding"** - Needs weeding
2. **"Remove tree suckers"** - Remove shoots
3. **"Backfill tree basin"** - Fill tree basin
4. **"Empty tree basin"** - Empty basin
5. **"Remove garden debris"** - Clean debris
6. **"Restake tree"** - Re-stake tree
7. **"Shrubbery blocking visibility"** - Blocking view
8. **"Lawn mowing"** - Needs mowing
9. **"Vacant lot weeding"** - Vacant lot needs work
10. **"Sprinkler system issues"** - Irrigation problems
11. **"Request water meter"** - Meter request
12. **"Other - Enter Details"** - Other landscaping

#### D4: Overgrown Tree

**Fixed field:** requestRegarding = "Overgrown Tree"

**requestType** (7 options):
1. ✅ **"Pruning request"** - Needs pruning (MOST COMMON)
2. **"Blocking sidewalk"** - Branches blocking path
3. **"Blocking street lights"** - Blocking lights
4. **"Blocking traffic signal"** - Blocking signals
5. **"Blocking signs"** - Blocking signs
6. **"Near communication line"** - Near power lines
7. **"Other - Enter Details"** - Other overgrowth

#### D5: Other Tree Issues

**Fixed fields:**
- requestRegarding = "Other"
- requestType = "N/A"

### Example Outputs:

**Fallen Tree:**
```json
{
  "category": "Fallen Tree",
  "formFields": {
    "requestRegarding": "Damaged Tree",
    "requestType": "Fallen tree",
    "requestDescription": "Large tree fallen across sidewalk..."
  }
}
```

**Tree Damaging Sidewalk:**
```json
{
  "category": "Fallen Tree",
  "formFields": {
    "requestRegarding": "Damaging Property",
    "requestType": "Lifted sidewalk - tree roots",
    "requestDescription": "Tree roots have lifted sidewalk sections..."
  }
}
```

---

## Summary Statistics

### Total Dropdown Options by Category:

| Category | Primary Options | Secondary Options | Total Combinations |
|----------|----------------|-------------------|-------------------|
| Road/Street | 5 requestType | None | **5** |
| Sidewalk/Curb | 6 requestType | 4+ secondaryRequestType | **10+** |
| Graffiti (Private) | 2 requestRegarding × 4 requestType | None | **8** |
| Graffiti (Public) | 2 requestRegarding × 17 requestType | None | **34** |
| Illegal Postings | 9 requestRegarding | None | **9** |
| Damaged Tree | 7 requestType | None | **7** |
| Damaging Property | 5 requestType | None | **5** |
| Landscaping | 12 requestType | None | **12** |
| Overgrown Tree | 7 requestType | None | **7** |
| Other Tree | 1 requestType | None | **1** |
| **TOTAL** | - | - | **98+ combinations** |

---

## AI Prompt Structure

The AI prompt in [image_agent.py:109-449](../backend/image_agent.py#L109-L449) follows this structure:

1. **Step 1: Filter** (lines 115-121)
   - Removes non-civic issues

2. **Step 2: Categorize** (lines 124-150)
   - Identifies one of 4 main categories

3. **Step 3: Select Form Fields** (lines 153-353)
   - **Category A:** Road/Street (lines 156-171)
   - **Category B:** Sidewalk/Curb (lines 173-196)
   - **Category C:** Graffiti (lines 198-274)
     - C1: Private Property (207-224)
     - C2: Public Property (225-254)
     - C3: Illegal Postings (256-273)
   - **Category D:** Tree Issues (lines 276-353)
     - D1: Damaged Tree (281-295)
     - D2: Damaging Property (297-309)
     - D3: Landscaping (311-330)
     - D4: Overgrown Tree (332-346)
     - D5: Other (348-352)

4. **Step 4: Generate JSON** (lines 356-370)
   - Returns structured response

5. **Examples** (lines 373-449)
   - 5 complete examples showing expected output

---

## Integration with Playwright Scripts

### Category → Script Mapping:

| AI Category | formFields | Playwright Script | Status |
|-------------|-----------|-------------------|--------|
| Road Crack | damageType, issueType, requestType | `unified-sf-form-automation.js` | ✅ Ready |
| Sidewalk Crack | damageType, issueType, requestType, secondaryRequestType | `unified-sf-form-automation.js` | ✅ Ready |
| Graffiti | issueType, requestRegarding, requestType | `graffiti-all-types-tester.js` | ✅ Ready |
| Fallen Tree | requestRegarding, requestType | `fallen-tree-form-tester.js` | ✅ Ready |

### Field Compatibility:

All field names and dropdown values have been extracted from the actual Playwright scripts and verified against successful test submissions:
- ✅ Verified against [unified-form-test-results.json](../scripts/sf-forms/unified-form-test-results.json)
- ✅ Verified against [graffiti-all-types-test-results.json](../scripts/sf-forms/graffiti-all-types-test-results.json)

---

## Benefits of Decision Tree Approach

### 1. **Structured Selection**
- AI follows a clear path: Filter → Categorize → Select → Generate
- Reduces ambiguity and hallucination
- Ensures fields are always compatible

### 2. **Exact Dropdown Values**
- AI sees all available options for each category
- Chooses "MOST FITTING" option from the list
- No guessing or generating invalid values

### 3. **Conditional Logic**
- AI understands when secondary dropdowns appear (e.g., sidewalk secondaryRequestType)
- Properly handles different graffiti property types
- Correctly categorizes tree issues into 5 subcategories

### 4. **100% Playwright Compatible**
- Every dropdown value extracted directly from Playwright scripts
- Field names match exactly what scripts expect
- Validated against successful test submissions

### 5. **Maintainable**
- When SF.gov forms change, update the decision tree
- Clear structure makes it easy to add new categories
- Self-documenting prompt

---

## Next Steps

1. ✅ **AI Prompt Updated** - Decision tree implemented in image_agent.py
2. ✅ **All Dropdown Options Extracted** - 98+ combinations documented
3. ✅ **Response Model Updated** - PipelineResponse includes form_fields
4. ⏳ **Test AI Output** - Verify AI selects correct dropdown values
5. ⏳ **Implement Playwright Integration** - Call scripts with AI-generated fields
6. ⏳ **Extract Tracking Numbers** - Parse service request numbers from output

---

## Testing Checklist

### Road/Street:
- [ ] Pothole/Pavement Defect
- [ ] Construction Plate Shifted
- [ ] Manhole Cover Off

### Sidewalk/Curb:
- [ ] Sidewalk Defect → Collapsed sidewalk
- [ ] Sidewalk Defect → Lifted sidewalk
- [ ] Sidewalk Defect → Cracked sidewalk
- [ ] Curb or Curb Ramp Defect

### Graffiti:
- [ ] Private Property → Building - Commercial
- [ ] Private Property → Building - Residential
- [ ] Public Property → Pole
- [ ] Public Property → Bridge
- [ ] Illegal Postings → Multiple Postings

### Tree:
- [ ] Damaged Tree → Fallen tree
- [ ] Damaged Tree → Hanging limb
- [ ] Damaging Property → Lifted sidewalk - tree roots
- [ ] Overgrown Tree → Pruning request

---

**Last Updated:** 2025-10-26
**Status:** Decision tree implemented and ready for testing ✅
