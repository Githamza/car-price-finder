// Test script for the new filter management endpoints
// Run this after starting the Azure Function locally

const BASE_URL = "http://localhost:7071/api";

// Test data for new filter
const newFilter = {
  title: "Test Filter",
  prompt:
    "Apply a test style to the image: Keep the same food, do not substitute the actual one with another, just change the styling of the photography to a test aesthetic. Realistic 8k quality.",
  imageUrl: "/filters/test-filter.png",
};

// Test adding a new filter
async function testAddFilter() {
  console.log("Testing add filter endpoint...");

  try {
    const response = await fetch(`${BASE_URL}/addfilter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newFilter),
    });

    const data = await response.json();
    console.log("Add filter response:", data);

    if (data.success) {
      console.log(`✅ Filter added successfully with ID: ${data.filterId}`);
      return data.filterId;
    } else {
      console.log("❌ Failed to add filter:", data.error);
      return null;
    }
  } catch (error) {
    console.error("❌ Error testing add filter:", error);
    return null;
  }
}

// Test getting all filters
async function testGetFilters() {
  console.log("\nTesting get filters endpoint...");

  try {
    const response = await fetch(`${BASE_URL}/getfilters`);
    const data = await response.json();

    console.log("Get filters response:", data);

    if (data.success) {
      console.log(`✅ Retrieved ${data.count} filters successfully`);
      return data.filters;
    } else {
      console.log("❌ Failed to get filters:", data.error);
      return null;
    }
  } catch (error) {
    console.error("❌ Error testing get filters:", error);
    return null;
  }
}

// Test deleting a filter
async function testDeleteFilter(filterId) {
  if (!filterId) {
    console.log("Skipping delete test - no filter ID available");
    return;
  }

  console.log(`\nTesting delete filter endpoint for ID: ${filterId}...`);

  try {
    const response = await fetch(`${BASE_URL}/deletefilter`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filterId }),
    });

    const data = await response.json();
    console.log("Delete filter response:", data);

    if (data.success) {
      console.log("✅ Filter deleted successfully");
    } else {
      console.log("❌ Failed to delete filter:", data.error);
    }
  } catch (error) {
    console.error("❌ Error testing delete filter:", error);
  }
}

// Run all tests
async function runTests() {
  console.log("🚀 Starting API endpoint tests...\n");

  // Test 1: Add filter
  const filterId = await testAddFilter();

  // Test 2: Get all filters
  await testGetFilters();

  // Test 3: Delete filter (cleanup)
  await testDeleteFilter(filterId);

  console.log("\n✨ All tests completed!");
}

// Run tests if this script is executed directly
if (typeof window === "undefined") {
  runTests().catch(console.error);
}

module.exports = { testAddFilter, testGetFilters, testDeleteFilter };

