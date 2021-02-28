/**
 * Clean a value to be consistent depending on the metadata feature.
 * @param {str or num} val - metadata value to clean
 * @param {str} feat - ethnicity, gender, age, location, bbtype, or wfreq
 * @returns {str or num} cleaned metadata value
 */
function cleanValue(val, feat) {
    if (!val) { // convert null values to "Unknown"
        val = 'Unknown';
    } else if (feat == 'gender' | feat == 'bbtype') { // capitalize gender and bbtype
        val = val[0].toUpperCase() + val.slice(1);
    } else if (feat == 'ethnicity') { // remove parentheses and update multiple ethnicities to "Mixed"
        val = val.split('(')[0];
        if (val.includes('/')) {val = 'Mixed';};
    } else if (feat == 'location') { // shorten location to US state or foreign country code
        val = val.match(/[A-Z]{2}/);
        if (val) {val = val[0];};
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
    let title = d3.select("#" + feat.slice(0, 3)).text();
    let layout = {
        title: title + ' of Volunteers', 
        yaxis: {title: 'Count'}, 
        xaxis: {title: title}
    };
    let trace = {};

    // Define trace
    if (feat == 'age' | feat == 'wfreq') { // histogram for numeric features
        trace['x'] = vals;
        trace['type'] = 'histogram';
    } else { // barchart for categorical features

        // Category counts
        let counts = {};
        vals.forEach(val => {
            if (counts[val]) {counts[val]++;}
            else {counts[val] = 1;}
        });

        // Trace
        trace['x'] = Object.keys(counts);
        trace['y'] = Object.values(counts);
        trace['type'] = 'bar';
    };

    // Plot data
    Plotly.newPlot("metadata-plot", [trace], layout, {responsive: true});
}


/**
 * Handler for the metadata select input. Upon change to the input, plot the 
 * values for the selected metadata feature.
 */
function metadataHandler() {
    let feat = d3.select("#metadata").property("value"); // selected option
    let vals = data['metadata'].map(person => cleanValue(person[feat], feat)); // clean values
    plotMetadata(vals, feat); // plot data
}


/**
 * Fill the sample select input with volunteer IDs from the data.
 */
function fillSelect() {
    data['names'].forEach(sid => {
        d3.select("#sample").append("option").attr("value", sid).text(sid);
    });
}


/**
 * Plot the top 10 bacterial species (OTU) found in a volunteer's navel sample 
 * and the count for each species. There may be less than 10 if the sample did 
 * not contain 10 OTUs.
 * @param {str} sampId - ID of sample
 */
function plotSample(sampId, wfreq) {
    let sample = data['samples'].filter(samp => samp['id'] == sampId)[0]; // selected sample
    
    // Top 10 OTUs
    let z = sample['otu_labels'].slice(0, 10).reverse().map(lab => lab.replaceAll(';', ' | ')); // species label
    let y = sample['otu_ids'].slice(0, 10).reverse().map(oid => `OID ${oid.toString()} `); // species IDs
    let x = sample['sample_values'].slice(0, 10).reverse(); // species counts

    // Plot horizontal barchart
    bar_layout = {title: 'Top Bacterial Species in Sample'};
    bar_trace = {x: x, y: y, text: z, type: 'bar', orientation: 'h'};
    Plotly.newPlot('otu-plot', [bar_trace], bar_layout, {responsive: true});

    // Plot gauge chart
    gauge_layout = {title: 'Washing Frequency', margin: {r: 1, l: 1}};
    gauge_trace = {
        value: wfreq, 
        title: 'Scrubs per week', 
        type: 'indicator', 
        mode: 'gauge+number'
    };
    Plotly.newPlot("wfreq-plot", [gauge_trace], gauge_layout, {responsive: true});
}


/**
 * Handler for the sample select input. Upon change to the input, generate 
 * a bar plot for the top 10 OTUs and a gauge chart for the volunteer's 
 * washing frequency.
 */
function sampleHandler() {
    let sampId = d3.select("#sample").property("value"); // selected option
    let metadata = data['metadata'].filter(samp => samp['id'] == sampId)[0]; // selected sample
    let wfreq = cleanValue(metadata['wfreq'], 'wfreq'); // washing frequency

    // Fill volunteer card with their demographic information
    d3.select("#sample-info").html(`<span class="card-text">
        Ethnicity : ${cleanValue(metadata['ethnicity'], 'ethnicity')} <br />
        Gender : ${cleanValue(metadata['gender'], 'gender')} <br />
        Age : ${cleanValue(metadata['age'], 'age')} <br />
        Location : ${cleanValue(metadata['location'], 'location')} <br />
        Belly Button Type : ${cleanValue(metadata['bbtype'], 'bbtype')} <br />
        Wash Frequency : ${wfreq} </span>`
    );

    // Bar and guage plots
    plotSample(sampId, wfreq);
}


/**
 * Initialize the page.
 */
function init() {
    fillSelect(); // fill sample dropdown menu with volunteer IDs
    sampleHandler(); // plot first sample on visit
    metadataHandler(); // plot first metadata feature on visit
}


// Initialize variable to store data
var data;

d3.json('samples.json').then(response => {
    console.log(response);
    data = response; // store data
    init(); // initialize page

    // Event listeners
    d3.select("#sample").on("change", sampleHandler); // on change to the sample select input
    d3.select("#metadata").on("change", metadataHandler); // on change to the metadata select input
});