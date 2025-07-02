// Set up the Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiaW1yYW5kYXRhIiwiYSI6ImNtMDRlaHh1YTA1aDEybHI1ZW12OGh4cDcifQ.fHLLFYQx7JKPUp2Sl1jtYg';

// Global variables to store article data and map reference for map2
let articleData2 = [];
let map2; // This will hold the reference to the second Mapbox map
let markers2 = []; // To store all markers added to the second map
let aggregatedData2 = {}; // To store the aggregated data for currently selected sources in scrolly2
let totalMentions2 = 0; // New variable to store the total number of mentions
let publications2 = ["Guardian", "CNN", "telegraph", "foxnews", "New York Times", "BBC"]; // Define publications2 array
let steps2; // Define steps2 variable for scrolly steps
let locationData2 = new Map(); // To store location and continent data

// Initialize scroller2 for Scrollama
const scroller2 = scrollama(); // Add this line to initialize scroller2

// Initial map state
const initialMapState = {
  center: [25.3563, 25.685], // Initial center coordinates
  zoom: 1.8 // Initial zoom level
};

// Global variable to track the previous step index
let previousStepIndex2 = null;

// Function to create and initialize the Mapbox map for scrolly2
function createMap2() {
  map2 = new mapboxgl.Map({
    container: 'map2', // Ensure this matches the container ID in your HTML for the second map
    style: 'mapbox://styles/imrandata/cmclqf6ov000a01sbh31acuj7',
    center: initialMapState.center,
    zoom: initialMapState.zoom,
    projection: 'mercator'
  });

  map2.scrollZoom.disable();
  document.getElementById("map2").style.backgroundColor = "white";

  // Wait for the map to load before adding layers and event listeners
  map2.on('load', function () {
    // Ensure the commonwealth layer starts as hidden
    map2.setLayoutProperty('commonwealth', 'visibility', 'none');
    
    // Load article data for the second map once initialized
    loadArticleData2();

    // Add event listeners to checkboxes dynamically for scrolly2
    addCheckboxEventListeners2();
  });
}

// Load article details from JSON for scrolly2
function loadArticleData2() {
  fetch('data/article_details.json')
    .then(response => response.json())
    .then(data => {
      articleData2 = data; // Store the data in a global variable for scrolly2
      console.log('Article data loaded for scrolly2, waiting for scroll event to show markers.');
    })
    .catch(error => console.error('Error loading article data for scrolly2:', error));
}

// Load location data once and store it in locationData2
function loadLocationData() {
  return fetch('data/location.csv')
    .then(response => response.text())
    .then(data => {
      const rows = data.split('\n').slice(1); // Ignore the header row
      rows.forEach(row => {
        const [location, lat, long, continent] = row.split(',');
        locationData2.set(location.trim(), { lat: parseFloat(lat), long: parseFloat(long), continent: continent.trim() });
      });
    })
    .catch(error => console.error('Error loading location data for scrolly2:', error));
}

// Function to add event listeners to checkboxes for scrolly2
function addCheckboxEventListeners2() {
  const checkboxes = document.querySelectorAll('.publication2');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', handleCheckboxChange2);
  });
}

// Function to handle checkbox changes for scrolly2
function handleCheckboxChange2(event) {
  const selectedSources = Array.from(document.querySelectorAll('.publication2:checked')).map(checkbox => checkbox.value);

  // Log the specific checkbox that was clicked
  const clickedCheckbox = event.target;
  const action = clickedCheckbox.checked ? 'Selected' : 'Deselected';
  console.log(`${clickedCheckbox.value} was ${action}`);

  // Log the currently selected sources
  console.log('Currently selected sources:', selectedSources);

  // Clear the current aggregated data and markers to recalculate
  aggregatedData2 = {};
  totalMentions2 = 0; // Reset the total mentions count

  let countryCountsByContinent = {}; // To keep track of the country counts per continent

  if (selectedSources.length > 0) {
    // Call existing function to update aggregated data
    updateAggregatedData2(selectedSources);

    // Count the countries based on their continent
    Object.keys(aggregatedData2).forEach(country => {
      const locData = locationData2.get(country); // Use the location data with continents
      if (locData) {
        const continent = locData.continent;
        if (!countryCountsByContinent[continent]) {
          countryCountsByContinent[continent] = 0;
        }
        countryCountsByContinent[continent]++; // Increment the count for the continent
      }
    });

    // Log the total number of selected countries and the breakdown by continent
    const totalCountries = Object.keys(aggregatedData2).length;
    console.log(`Total selected countries: ${totalCountries}`);
    console.log('Country counts by continent:', countryCountsByContinent);

    // Call the existing function to update the map with aggregated data
    updateMapWithAggregatedData2();
  } else {
    // Remove all markers if no sources are selected
    clearMarkers2();
  }
}


// Function to update the aggregated data based on selected sources for scrolly2
function updateAggregatedData2(selectedSources) {
  selectedSources.forEach(source => {
    articleData2.forEach(article => {
      if (article.publication === source) {
        // Aggregate data based on country_frequencies
        for (const [country, frequency] of Object.entries(article.country_frequencies)) {
          aggregatedData2[country] = (aggregatedData2[country] || 0) + frequency;
          totalMentions2 += frequency; // Increment total mentions
        }
      }
    });
  });

  console.log('Aggregated data:', aggregatedData2); // Debugging line to check aggregated data
  console.log('Total mentions:', totalMentions2); // Debugging line to check total mentions

  // New line to log the total number of unique countries
  const totalCountries = Object.keys(aggregatedData2).length;
  console.log('Total unique countries:', totalCountries);
}

// Function to update the map with aggregated data for scrolly2
function updateMapWithAggregatedData2() {
  clearMarkers2(); // Ensure no previous markers remain

  let countryDataArray = []; // Array to store country, frequency, and percentage

  // Add new markers based on the updated aggregated data
// In the part where you create markers for the map:
for (const [country, frequency] of Object.entries(aggregatedData2)) {
  const locData = locationData2.get(country);
  if (locData) {
    // Calculate the percentage for each country
    const percentage = ((frequency / totalMentions2) * 100).toFixed(2); // Calculate percentage

    // Get the circle radius based on percentage
    const circleRadius = getCircleRadius(percentage);

    let el = document.createElement('div');
    el.className = 'marker';
    el.style.width = `${circleRadius * 2}px`;
    el.style.height = `${circleRadius * 2}px`;
    el.style.backgroundColor = '#D02D00';
    el.style.borderRadius = '50%';
    el.style.opacity = '0.85';

    let marker = new mapboxgl.Marker(el)
      .setLngLat([locData.long, locData.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${country}</strong><br>Percentage: ${percentage}%`)) // Display percentage
      .addTo(map2);

    markers2.push(marker);
  }
}


  // Sort the country data by percentage in descending order
  countryDataArray.sort((a, b) => b.percentage - a.percentage);

  // Get the top 5 countries and log them
  console.log("Top 5 countries by percentage:");
  countryDataArray.slice(0, 5).forEach((countryData, index) => {
    console.log(
      `${index + 1}. Country: ${countryData.country}, Frequency: ${countryData.frequency}, Percentage: ${countryData.percentage}%`
    );
  });
}



// Function to clear all markers from map2
function clearMarkers2() {
  markers2.forEach(marker => marker.remove());
  markers2 = [];
  console.log('Markers cleared'); // Debugging line to confirm markers are cleared
}

// Helper function to calculate the radius of a marker circle based on the frequency count
// Helper function to calculate the radius of a marker circle based on the percentage
function getCircleRadius(percentage) {
  const baseRadius = 3; // Base radius for small percentages
  const scaleFactor = 2.5; // Adjust this to control how much the radius grows with percentage
  const radius = baseRadius + (Math.sqrt(percentage) * scaleFactor);
  return radius;
}

// In the part where you create markers for the map:
for (const [country, frequency] of Object.entries(aggregatedData2)) {
  const locData = locationData2.get(country);
  if (locData) {
    // Calculate the percentage for each country
    const percentage = ((frequency / totalMentions2) * 100).toFixed(2); // Calculate percentage

    // Get the circle radius based on percentage
    const circleRadius = getCircleRadius(percentage);

    let el = document.createElement('div');
    el.className = 'marker';
    el.style.width = `${circleRadius * 2}px`;
    el.style.height = `${circleRadius * 2}px`;
    el.style.backgroundColor = '#D02D00';
    el.style.borderRadius = '50%';
    el.style.opacity = '0.85';

    let marker = new mapboxgl.Marker(el)
      .setLngLat([locData.long, locData.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${country}</strong><br>Percentage: ${percentage}%`)) // Display percentage
      .addTo(map2);

    markers2.push(marker);
  }
}


// Scrollama event handlers for scrolly2
// Scrollama event handlers for scrolly2
function handleStepEnter2(response) {
  var el = response.element;
  console.log('Entering step:', response.index); // Debugging line to check step index
  console.log('scrolly2 step:', el);

  // Remove is-active from all steps
  steps2.forEach(step => step.classList.remove('is-active'));
  el.classList.add('is-active');

  // Show tabs2 only when the scroll index is 3, otherwise hide it
  if (response.index === 3) {
    document.querySelector('.tabs2').classList.add('visible'); // Show the publication buttons
    
    // Select all publications automatically when on index 3
    publications2.forEach(publication => {
      const checkboxToSelect2 = document.querySelector(`input[type="checkbox"].publication2[value="${publication}"]`);
      if (checkboxToSelect2 && !checkboxToSelect2.checked) {
        checkboxToSelect2.checked = true;
        checkboxToSelect2.dispatchEvent(new Event('change')); // Trigger the change event to update the map
      }
    });
  } else {
    document.querySelector('.tabs2').classList.remove('visible'); // Hide the publication buttons
  }

  // Determine the publication to select based on the step index
  let publicationToSelect2;
  if (response.index === 0) {
    publicationToSelect2 = "Guardian"; // Select "Guardian" for the first step
    map2.flyTo({ center: initialMapState.center, zoom: initialMapState.zoom, speed: 1.2, curve: 1.5 });
  } else if (response.index === 1) {
    publicationToSelect2 = "Guardian"; // Select "Guardian" for the second step
    map2.flyTo({ center: [20.0, 10.0], zoom: 3.5, speed: 1.2, curve: 1.5 });
  } else if (response.index === 2) {
    publicationToSelect2 = "CNN"; // Select "CNN" for the third step
    map2.flyTo({ center: initialMapState.center, zoom: initialMapState.zoom, speed: 1.2, curve: 1.5 });
  }

  // Only select the specific publication if not on index 3
  if (response.index !== 3) {
    const checkboxToSelect2 = document.querySelector(`input[type="checkbox"].publication2[value="${publicationToSelect2}"]`);

    if (checkboxToSelect2) {
      // Deselect all publications first
      publications2.forEach(publication => {
        const checkboxToDeselect2 = document.querySelector(`input[type="checkbox"].publication2[value="${publication}"]`);
        if (checkboxToDeselect2 && checkboxToDeselect2.checked) {
          checkboxToDeselect2.checked = false;
          checkboxToDeselect2.dispatchEvent(new Event('change')); // Trigger the change event
        }
      });

      // Then select the correct publication
      if (!checkboxToSelect2.checked) {
        checkboxToSelect2.checked = true;
        checkboxToSelect2.dispatchEvent(new Event('change')); // Trigger the change event to update the map
      }
    }
  }

  previousStepIndex2 = response.index;
}



function handleStepExit2(response) {
  console.log('Exiting step:', response.index); // Debugging line to check exit step
  console.log('Scroll direction:', response.direction); // Check scroll direction

  // If exiting step 3, hide the tabs2 buttons
  if (response.index === 3) {
    document.querySelector('.tabs2').classList.remove('visible'); // Hide the publication buttons when leaving step 3
  }

  // Handle scrolling upwards and ensure the correct publication is selected for previous steps
  if (response.direction === 'up') {
    if (response.index === 0) {
      map2.flyTo({ center: initialMapState.center, zoom: initialMapState.zoom, speed: 1.2, curve: 1.5 });
      const checkboxToSelect2 = document.querySelector(`input[type="checkbox"].publication2[value="Guardian"]`);
      if (checkboxToSelect2 && !checkboxToSelect2.checked) {
        checkboxToSelect2.checked = true;
        checkboxToSelect2.dispatchEvent(new Event('change'));
      }
    } else if (response.index === 1) {
      map2.flyTo({ center: initialMapState.center, zoom: initialMapState.zoom, speed: 1.2, curve: 1.5 });
      const checkboxToSelect2 = document.querySelector(`input[type="checkbox"].publication2[value="Guardian"]`);
      if (checkboxToSelect2 && !checkboxToSelect2.checked) {
        checkboxToSelect2.checked = true;
        checkboxToSelect2.dispatchEvent(new Event('change'));
      }
    } else if (response.index === 2) {
      map2.setLayoutProperty('commonwealth', 'visibility', 'none');
      map2.flyTo({ center: [20.0, 10.0], zoom: 3.5, speed: 1.2, curve: 1.5 });
      const checkboxToSelect2 = document.querySelector(`input[type="checkbox"].publication2[value="CNN"]`);
      if (checkboxToSelect2 && !checkboxToSelect2.checked) {
        checkboxToSelect2.checked = true;
        checkboxToSelect2.dispatchEvent(new Event('change'));
      }
    }
  }

  // Ensure no other publication gets selected when scrolling out of active steps
  if (document.querySelectorAll("#scrolly2 .step2.is-active").length === 0 && response.index !== 3) {
    publications2.forEach(publication => {
      const checkboxToDeselect2 = document.querySelector(`input[type="checkbox"].publication2[value="${publication}"]`);
      if (checkboxToDeselect2 && checkboxToDeselect2.checked) {
        checkboxToDeselect2.checked = false;
        checkboxToDeselect2.dispatchEvent(new Event('change'));
      }
    });
  }
}






// Initialize scrollama for scrolly2
function init2() {
  steps2 = document.querySelectorAll('#scrolly2 article .step2');

  scroller2
    .setup({
      step: "#scrolly2 article .step2",
      offset: 0.70,
      debug: false
    })
    .onStepEnter(handleStepEnter2)
    .onStepExit(handleStepExit2);

  window.addEventListener("resize", scroller2.resize);
}

// Load location data once before initializing the map and event listeners
loadLocationData().then(() => {
  createMap2();
  init2();
});
