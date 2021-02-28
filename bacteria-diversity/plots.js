/**
 * Clean a value to be consistent depending on the metadata feature.
 * @param {str or num} val - metadata value to clean
 * @param {str} feat - ethnicity, gender, age, location, bbtype, or wfreq
 * @returns {str or num} cleaned metadata value
 */
function cleanValue(val, feat) {

    // Convert null values to "Unknown"
    if (!val) { 
        val = 'Unknown';

    // Capitalize gender and bbtype
    } else if (feat == 'gender' | feat == 'bbtype') {
        val = val[0].toUpperCase() + val.slice(1);

    // Clean ethnicity
    } else if (feat == 'ethnicity') { 
        val = val.split('(')[0]; // remove content inside parentheses
        if (val.includes('/')) {val = 'Mixed';}; // update multiple ethnicities to "mixed"

    // Shorten location to US state or foreign country code
    } else if (feat == 'location') {
        val = val.match(/[A-Z]{2}/); // extract 2 capital letters
        if (val) {val = val[0];}; // get matched string
    };

    return val;
}


/**
 * Plot a histogram of the values if the metadata feature is numeric or a 
 * barchart if the feature is categorical.
 * @param {arr[str or num]} vals - values to plot
 * @param {str} feat - ethnicity, gender, age, location, bbtype, or wfreq
 */
function plotMetadata(vals, feat) {

    // Plot layout and data
    title = d3.select('#' + feat.slice(0, 3)).text();
    let layout = {
        title: title + ' of Volunteers',
        yaxis: {title: 'Count'},
        xaxis: {title: title}
    };
    let trace = {};

    // Plot a histogram for numeric features
    if (feat == 'age' | feat == 'wfreq') {
        trace['x'] = vals;
        trace['type'] = 'histogram';

    // Plot a barchart for categorical features
    } else {

        // Get count for each category
        let counts = {};
        vals.forEach((val) => {
            if (counts[val]) {counts[val]++;}
            else {counts[val] = 1;}
        });

        // Define trace
        trace['x'] = Object.keys(counts);
        trace['y'] = Object.values(counts);
        trace['type'] = 'bar';
    };

    // Plot data
    Plotly.newPlot('metadata-plot', [trace], layout, {responsive: true});
}


/**
 * Handler for the metadata select input. Upon change to the input, plot the 
 * values for the selected metadata feature.
 */
function metadataHandler() {

    // Get user input
    let feat = d3.select("#metadata").property("value");

    // Get feature from data
    let vals = [];
    data["metadata"].forEach(person => {

        // Clean value and add to array
        let val = cleanValue(person[feat], feat);
        vals.push(val);
    });

    // Plot data
    plotMetadata(vals, feat);
}


/**
 * Fill the select input with volunteer IDs from the data.
 */
function fillSelect() {
    data["names"].forEach(sid => {
        d3.select("#sample").append("option").attr("value", sid).text(sid);
    });
}


/**
 * Plot the top 10 bacterial species found in a volunteer's navel sample and 
 * the count of each species.
 * @param {str} sampId - ID of sample
 */
function plotOtu(sampId, wfreq) {

    // Get sample from ID
    let sample = data["samples"].filter(samp => samp["id"] == sampId)[0];
    
    // OTU labels, IDs, and sample values
    let z = sample["otu_labels"].slice(0, 10).reverse();
    let y = sample["otu_ids"].slice(0, 10).reverse().map(oid => 
        "OID " + oid.toString() + " ");
    let x = sample["sample_values"].slice(0, 10).reverse();

    // Plot horizontal barchart
    bar_layout = {title: "Top Bacterial Species in Sample"};
    bar_trace = {x: x, y: y, type: "bar", orientation: "h"};
    Plotly.newPlot("species-plot", [bar_trace], bar_layout, {responsive: true});

    // Plot gauge chart
    gauge_layout = {
        title: "Washing Frequency", 
        margin: {r: 1, l: 1}
    };
    gauge_trace = {
        value: wfreq, 
        title: "Scrubs per week", 
        type: "indicator", 
        mode: "gauge+number"
    };
    Plotly.newPlot("wfreq-plot", [gauge_trace], gauge_layout, {responsive: true});
}


/**
 * 
 */
function sampleHandler() {

    // Get user input
    let sampId = d3.select("#sample").property("value");
    console.log(data);
    
    // Extract metadata
    let metadata = data["metadata"].filter(samp => samp["id"] == sampId)[0];
    let wfreq = cleanValue(metadata["wfreq"], "wfreq"); // wash frequency
    // Fill demographic card with information
    d3.select("#sample-info").html(`<span class="card-text">
        Ethnicity : ${cleanValue(metadata["ethnicity"], "ethnicity")} <br />
        Gender : ${cleanValue(metadata["gender"], "gender")} <br />
        Age : ${cleanValue(metadata["age"], "age")} <br />
        Location : ${cleanValue(metadata["location"], "location")} <br />
        Belly Button Type : ${cleanValue(metadata["bbtype"], "bbtype")} <br />
        Wash Frequency : ${wfreq} </span>`
    );

    // Plot top bacterial species and wash frequency gauge
    plotOtu(sampId, wfreq);
}


/**
 * Functions to run when page is first visited.
 */
function init() {

    // Fill first dropdown with volunteer IDs
    fillSelect();

    // Plot first option on visit
    sampleHandler();
    metadataHandler();
}


// Initialize variable to store data
var data;

d3.json("samples.json").then(response => {

    // Store data
    data = response;

    // Initialize page
    init();

    // Event listener for any change to the sample select input
    d3.select("#sample").on("change", sampleHandler);

    // Event listener for any change to the metadata select input
    d3.select("#metadata").on("change", metadataHandler);
});