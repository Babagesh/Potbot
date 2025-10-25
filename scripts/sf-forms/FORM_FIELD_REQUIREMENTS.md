# SF.gov Form Field Requirements

This document tracks all the required fields that our API needs to provide for each SF.gov form.

## 📋 Pothole Form Requirements

### **Form URL:** `https://www.sf.gov/report-pothole-and-street-issues`

### **Step 1: Issue Type Selection**
- **Field:** Radio button selection
- **Options:** 
  - `Sidewalk/Curb` - For sidewalk and curb issues
  - `Street` - For street/pavement issues (including potholes)
- **Required:** ✅ Yes
- **API Field:** `issueType` (string: "Sidewalk/Curb" or "Street")

### **Step 2: Location Data**
- **Field:** Address input with map overlay
- **Description:** "Find address or place" text input
- **Required:** ✅ Yes
- **API Field:** `coordinates` (string: "latitude, longitude")
- **Example:** `"37.755196, -122.423207"`

### **Step 3: Location Description**
- **Field:** Textarea for additional location details
- **Description:** "Additional details to assist the responding agency in locating the issue. For example, it may be close to a nearby landmark, property or specific part of a property."
- **Required:** ✅ Yes
- **API Field:** `locationDescription` (string)
- **Example:** `"On the side of the street facing Plane Jaine restaurant directly in the center of the right lane."`

### **Step 4: Next Page Fields** (To be discovered)
- **Status:** 🔄 Pending analysis of next page
- **Fields:** TBD after completing Step 3

---

## 🔄 Other Forms (To be analyzed)

### **Sidewalk Form**
- **Status:** 🔄 Pending
- **URL:** `https://www.sf.gov/report-curb-and-sidewalk-problems`

### **Graffiti Form**
- **Status:** 🔄 Pending
- **URL:** `https://www.sf.gov/report-graffiti-issues`

### **Trash Form**
- **Status:** 🔄 Pending
- **URL:** `https://www.sf.gov/report-garbage-container-issues`

### **Street Markings Form**
- **Status:** 🔄 Pending
- **URL:** `https://www.sf.gov/report-faded-street-and-pavement-markings`

### **Street Light Form**
- **Status:** 🔄 Pending
- **URL:** `https://www.sf.gov/report-problem-streetlight`

### **Fallen Tree Form**
- **Status:** 🔄 Pending
- **URL:** `https://www.sf.gov/report-damaged-or-fallen-tree`

---

## 📊 API Data Structure

### **Required for Pothole Form:**
```json
{
  "damageType": "pothole",
  "issueType": "Street",
  "coordinates": "37.755196, -122.423207",
  "locationDescription": "On the side of the street facing Plane Jaine restaurant directly in the center of the right lane.",
  "imagePath": "/path/to/image.jpg",
  "description": "AI-generated description from CV analysis",
  "severity": "high",
  "reporterName": "Pot Buddy User",
  "reporterEmail": "potbuddy@example.com",
  "reporterPhone": "555-123-4567"
}
```

### **Future API Structure (Complete):**
```json
{
  "damageType": "pothole|sidewalk|graffiti|trash|streetMarkings|streetlight|fallenTree",
  "issueType": "Street|Sidewalk/Curb|Other",
  "coordinates": "latitude, longitude",
  "locationDescription": "Detailed location description",
  "imagePath": "/path/to/image.jpg",
  "description": "AI-generated description from CV analysis",
  "severity": "low|medium|high",
  "reporterName": "Reporter name",
  "reporterEmail": "reporter@email.com",
  "reporterPhone": "555-123-4567",
  "additionalNotes": "Any additional information"
}
```

---

## 🎯 Next Steps

1. **Complete Pothole Form Analysis** - Finish analyzing all pages of the pothole form
2. **Test Pothole Automation** - Run the automation with sample data
3. **Analyze Other Forms** - Apply the same process to other forms
4. **Create Unified API** - Build a single API that handles all form types
5. **Integrate with CV Pipeline** - Connect with computer vision analysis

---

## 📝 Notes

- All forms use the Verint system with emergency disclaimer workflow
- Location data requires GPS coordinates that get converted to addresses
- Each form may have different field requirements
- File upload fields will need image handling
- Some forms may have additional steps or different workflows

---

*Last Updated: 2025-10-25*
*Status: Pothole form analysis in progress*
