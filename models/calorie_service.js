const axios = require('axios');

// Asynchronously fetch calories from the OpenFoodFacts API based on a food item's name
async function fetchCalories(foodItem) {
  try { // sends a GET request to OpenFoodFacts using Axios
    const response = await axios.get(
      'https://world.openfoodfacts.org/cgi/search.pl',
      {
        params: {
          search_terms: foodItem,
          search_simple: 1,
          action: 'process',
          json: 1
        }
      }
    );

    const product = response.data.products[0];

    if (
      product &&
      product.nutriments &&
      product.nutriments['energy-kcal']
    ) {
      return Math.round(product.nutriments['energy-kcal']); // Get calories
    } else {
      return 0; // No match found
    }

  } catch (error) {
    console.error('OpenFoodFacts API error:', error.message);
    return 0;
  }
}

module.exports = { fetchCalories };
