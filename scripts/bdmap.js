// Array of publication values corresponding to each step
const publications = ["Guardian", "foxnews", "CNN", "telegraph", "New York Times", "BBC"];
const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();

// DOM - document object model
var main = document.querySelector("main");
var scrolly = main.querySelector("#scrolly");
var sticky = scrolly.querySelector(".sticky-thing");
var article = scrolly.querySelector("article");
var steps = article.querySelectorAll(".step");

// Initialize the scrollama
var scroller = scrollama();

// Function to create and initialize the map and add GeoJSON layer
function createMap() {
  let map = L.map("map", {
    minZoom: 0.45,
    scrollWheelZoom: false,
    doubleClickZoom: true,
    zoomControl: false // Disable the default zoom control

  }).setView([23.685, 90.3563], 7.45);
  L.control.zoom({
    position: 'topright'  // Move zoom control to the upper right
  }).addTo(map);
  
  document.getElementById("map").style.backgroundColor = primaryColor;

  fetch("data/bd_districts.geojson")
    .then((response) => response.json())
    .then((geojsonData) => {
      L.geoJSON(geojsonData, {
        style: function (feature) {
          return {
            fillColor: "#8A9A5B",
            color: "#6F9379",
            weight: 1,
            fillOpacity: 0.7,
            opacity: 1,
          };
        },
        onEachFeature: function (feature, layer) {
          if (feature.properties && feature.properties.name) {
            layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
          }
        },
      }).addTo(map);
    })
    .catch((error) => console.error("Error loading GeoJSON data:", error));

  initializeDataAndMarkers(map);
}

function initializeDataAndMarkers(map) {
  const publicationsMap1 = document.querySelectorAll('.publication');
  const locationData = new Map();
  let markers = [];

  fetch('data/location.csv')
    .then(response => response.text())
    .then(data => {
      const rows = data.split('\n').slice(1);
      rows.forEach(row => {
        const [location, lat, long] = row.split(',');
        locationData.set(location.trim(), { lat: parseFloat(lat), long: parseFloat(long) });
      });
      console.log('Location data (districts and countries) parsed and stored:', locationData);
    });

  fetch('data/article_details.json')
    .then(response => response.json())
    .then(articleDetails => {
      let aggregatedData = {};

      publicationsMap1.forEach(publication => {
        publication.addEventListener('change', () => {
          aggregatedData = {};

          publicationsMap1.forEach(pub => {
            if (pub.checked) {
              articleDetails.forEach(article => {
                if (article.publication === pub.value) {
                  for (const [location, frequency] of Object.entries(article.district_frequencies)) {
                    aggregatedData[location] = (aggregatedData[location] || 0) + frequency;
                  }
                }
              });
            }
          });

          updateLeafletMap(map, markers, aggregatedData, locationData);
        });
      });
    });

    function updateLeafletMap(map, markers, data, locationData) {
      console.log('Updating Leaflet map with new data:', data);
    
      // Remove existing markers
      markers.forEach(marker => map.removeLayer(marker));
      markers.length = 0;
    
      // Calculate the total mentions across all districts
      const totalMentions = Object.values(data).reduce((sum, frequency) => sum + frequency, 0);
    
      // Loop through each location's frequency data
      for (const [location, frequency] of Object.entries(data)) {
        const locData = locationData.get(location);
    
        if (locData) {
          // Calculate the percentage for the current location
          const percentage = (frequency / totalMentions) * 100;
    
          // Pass the percentage to the getCircleRadius function
          const circleRadius = getCircleRadius(percentage);
    
          // Log the percentage and calculated radius to debug the values
          console.log(`Location: ${location}, Frequency: ${frequency}, Percentage: ${percentage}%, Circle Radius: ${circleRadius}`);
    
          let markerHtmlStyles = `
  background-color: #D02D00;
  border-radius: 50%;
  opacity: 0.85;
  width: ${circleRadius * 2}px;
  height: ${circleRadius * 2}px;
  display: block;
  position: relative;
  transform-origin: 50% 50%;
`;

    
          let customIcon = L.divIcon({
            className: "animated-marker",
            iconAnchor: [circleRadius, circleRadius],
            popupAnchor: [0, -circleRadius],
            html: `<span style="${markerHtmlStyles}"></span>`
          });
    
          let marker = L.marker([locData.lat, locData.long], { icon: customIcon })
            .addTo(map)
            .bindPopup(`<strong>${location}</strong><br>Percentage: ${percentage.toFixed(2)}%`);
    
          markers.push(marker);
        } else {
          console.log(`Location data not found for ${location}`);
        }
      }
    }
    
    
  

    function getCircleRadius(percentage) {
      const baseRadius = 2.5;
      const scaleFactor = 0.010;  // Adjust the scale factor if needed
      const exponent = 2;
      const boostFactor = 4.5;
    
      let radius;
      if (percentage <= 13) {
        // Apply a boost to smaller percentages
        radius = baseRadius + (Math.pow(percentage, exponent) * scaleFactor * boostFactor);
      } else {
        // Regular scaling for larger percentages
        radius = baseRadius + (Math.pow(percentage, exponent) * scaleFactor);
      }
    
      // Log the percentage and radius to verify
      console.log(`Percentage: ${percentage}, Radius: ${radius}`);
      return radius;
    }
  
}

function handleStepEnter(response) {
  var el = response.element;
  console.log(el);

  steps.forEach(step => step.classList.remove('is-active'));
  el.classList.add('is-active');

  // Check if we are on the third step (index 2)
  if (response.index === 2) {
    // Select all publications
    publications.forEach((publication) => {
      const checkboxToSelect = document.querySelector(`input[type="checkbox"][value="${publication}"]`);
      if (checkboxToSelect && !checkboxToSelect.checked) {
        checkboxToSelect.checked = true;
        checkboxToSelect.dispatchEvent(new Event('change'));
      }
    });
  } else {
    // Otherwise, just select the publication based on the current index
    const publicationToSelect = publications[response.index];
    const checkboxToSelect = document.querySelector(`input[type="checkbox"][value="${publicationToSelect}"]`);

    if (checkboxToSelect) {
      // Uncheck all other checkboxes
      publications.forEach((publication) => {
        const checkboxToDeselect = document.querySelector(`input[type="checkbox"][value="${publication}"]`);
        if (checkboxToDeselect && checkboxToDeselect.checked) {
          checkboxToDeselect.checked = false;
          checkboxToDeselect.dispatchEvent(new Event('change'));
        }
      });

      // Check the current publication's checkbox
      if (!checkboxToSelect.checked) {
        checkboxToSelect.checked = true;
        checkboxToSelect.dispatchEvent(new Event('change'));
      }
    }
  }
}


// New function to handle when a step is exited
function handleStepExit(response) {
  // Check if all steps are inactive
  if (document.querySelectorAll(".step.is-active").length === 0) {
    // Uncheck all checkboxes
    publications.forEach((publication) => {
      const checkboxToDeselect = document.querySelector(`input[type="checkbox"][value="${publication}"]`);
      if (checkboxToDeselect && checkboxToDeselect.checked) {
        checkboxToDeselect.checked = false;
        checkboxToDeselect.dispatchEvent(new Event('change')); // Trigger the change event to remove markers
      }
    });
  }
}

// Initialize the scrollama
function init() {
  scroller
    .setup({
      step: "#scrolly article .step",
      offset: 0.53,
      debug: false
    })
    .onStepEnter(handleStepEnter)
    .onStepExit(handleStepExit); // Add the step exit event

  window.addEventListener("resize", scroller.resize);
}

createMap();
init();
