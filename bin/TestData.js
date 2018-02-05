var moment  = require('moment');
var argv    = require('yargs')
				.default
				({
					'id': '',
					'parameters': '',
					'start': '',
					'stop': ''
				})
				.argv;

var parameters = argv.parameters.split(",");
var start = argv.start.replace("Z","");
var stop  = argv.stop.replace("Z","");
var id    = argv.id;

// Date YYYY-MM-DD or YYYY-DOY with no Z is considered invalid by moment.js
// see timeCheck().
if (start.length == 8 || start.length == 10) { // YYYY-MM-DD
	start = start + "T00:00:00.000";
}
if (stop.length == 8 || stop.length == 10) { // YYYY-DOY
	stop = stop + "T00:00:00.000";
}

var startsec = moment(start+"Z").valueOf()/1000;
var stopsec  = moment(stop+"Z").valueOf()/1000;

startsec = Math.floor(startsec);
stopsec  = Math.floor(stopsec);

var records = ""; // Number of records (lines)
var record  = ""; // A record with comma-separated fields (columns)
var Nwrote  = 0;  // Number of records flushed

scalarstrs = ["P/P","P/F","F/P","F/F"];
scalarcats = [0,1,2];

for (var i = startsec; i < stopsec; i++) {
	var record = "";
	if (parameters.includes('Time')) {
		record = (new Date(i*1000).toISOString()).slice(0,-1);
	}
	if (parameters.includes('scalar')) {
		record = record + "," + Math.sin(Math.PI*i/600);
	}
	if (parameters.includes('scalarint')) {
		record = record + "," + Math.round(1000*Math.sin(Math.PI*i/600));
	}
	if (parameters.includes('scalarstr')) {
		record = record + "," + scalarstrs[(i-startsec) % scalarstrs.length];
	}
	if (parameters.includes('scalarcats')) {
		record = record + "," + scalarcats[(i-startsec) % scalarcats.length];
	}
	if (parameters.includes('scalariso')) {
		record = record + "," + (new Date((i+1)*1000).toISOString()).slice(0,-5) + "Z";
	}
	if (parameters.includes('scalarmulti')) {
		record = record + "," + Math.sin(Math.PI*i/600);
	}
	if (parameters.includes('vector')) {
		record = record 
					+ "," + Math.sin(Math.PI*(i-startsec)/600) 
					+ "," + Math.sin(Math.PI*(i-startsec-150)/600) 
					+ "," + Math.sin(Math.PI*(i-startsec-300)/600)
	}
	if (parameters.includes('vectorint')) {
		record = record 
					+ "," + Math.round(1000*Math.sin(Math.PI*i/600))
					+ "," + Math.round(1000*Math.sin(Math.PI*i/600))
					+ "," + Math.round(1000*Math.sin(Math.PI*i/600));
	}
	if (parameters.includes('vectorstr')) {
		record = record 
						+ "," + scalarstrs[(i-startsec) % scalarstrs.length]
						+ "," + scalarstrs[(i-startsec+1) % scalarstrs.length]
						+ "," + scalarstrs[(i-startsec+2) % scalarstrs.length];
	}
	if (parameters.includes('vectorcats')) {
		record = record 
					+ "," + scalarcats[(i-startsec)   % scalarcats.length]
					+ "," + scalarcats[(i-startsec+1) % scalarcats.length]
					+ "," + scalarcats[(i-startsec+2) % scalarcats.length];
	}
	if (parameters.includes('vectoriso')) {
		record = record 
					+ "," + (new Date((i+1)*1000).toISOString()).slice(0,-5)
					+ "," + (new Date((i+2)*1000).toISOString()).slice(0,-5)
					+ "," + (new Date((i+3)*1000).toISOString()).slice(0,-5);
	}
	if (parameters.includes('vectormulti')) {
		record = record 
					+ "," + Math.sin(Math.PI*(i-startsec)/600) 
					+ "," + Math.sin(Math.PI*(i-startsec-150)/600) 
					+ "," + Math.sin(Math.PI*(i-startsec-300)/600)
					+ "," + Math.sin(Math.PI*(i-startsec)/600) 
					+ "," + Math.sin(Math.PI*(i-startsec-150)/600) 
					+ "," + Math.sin(Math.PI*(i-startsec-300)/600)
	}
	if (parameters.includes('transform')) {
		for (var j = 0;j < 9;j++) {
			record = record + "," + Math.sin((Math.PI/300)*(i-startsec)/(j+1));
		}
	}
	if (parameters.includes('transformmulti')) {
		for (var j = 0;j < 9;j++) {
			record = record + "," + Math.sin((Math.PI/300)*(i-startsec)/(j+1));
		}
	}
	if (parameters.includes('spectra')) {
		record = record + "," + 0; // f = 0 bin.
		for (var j = 1;j < 10;j++) {
			record = record + "," + 1/j;
		}
	}
	if (parameters.includes('spectranobins')) {
		for (var j = 0;j < 10;j++) {
			record = record + "," + j;
		}
	}
	if (parameters.includes('spectralarge')) {
		record = record + "," + 0; // f = 0 bin.
		for (var j = 1;j < 100;j++) {
			record = record + "," + 1/j;
		}
	}
	if (parameters.includes('spectramulti')) {
		record = record + "," + 0; // f = 0 bin.
		for (var j = 1;j < 10;j++) {
			record = record + "," + 1/j;
		}
		record = record + "," + 0; // f = 0 bin.
		for (var j = 1;j < 10;j++) {
			record = record + "," + 2/j;
		}
	}

	if (id === "dataset0") {
		record = record.replace(/,/g,", ");  // Make dataset0 use space after comma.
	}

	if (records.length > 0) {
		records = records + "\n" + record;
	} else {
		records = record;
	}

	// Flush to output at end and every 100 records (lines)
	var flush = (i == stopsec - 1) 
				|| (i > startsec && (i-startsec) % 100 === 0);
	if (flush) {
		if (id !== "dataset0") {
			console.log(records); // Correct way.					
		} else {
			// Make time non-monotonic for dataset0.
			records = records.split("\n");
			l = records.length-1;
			first = records[0];
			last = records[l];
			records[0] = last;
			records[l] = first;
			records = records.join("\n");
			if ((i == stopsec - 1) && parameters.includes('scalariso')) {
				// Omit newline at end of file for dataset0 if scalariso requested
				process.stdout.write(records);
			} else {
					// Add extra newline at end of file for dataset0 if scalariso not requested
				console.log(records + "\n");
			}
		}
		records = "";
		Nwrote  = (i-startsec);
	}
}