function doGet(e) {
  const tpl = HtmlService.createTemplateFromFile('Bookings');
  tpl.aircrafts = getAircrafts_();
  tpl.bookings = getBookings_();
  return tpl.evaluate()
            .setTitle('Resource Scheduler 123')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
            .addMetaTag('viewport','width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getAircrafts_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Aircrafts');
  const rows  = sheet.getDataRange().getValues().slice(1); // skip header row
  return rows.map(r => ({ tailNumber: r[0], type: r[1] }));
}

function getBookings_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Bookings');
  const cssRows  = sheet.getDataRange().getValues().slice(1); // skip header row
  const rows = cssRows.map(r => ({ id: r[0], timestamp: r[1], bookingStart: r[2], bookingLength: r[3], tailNumber: r[4], pilotName: r[5] }));

  const now = new Date();
  const activeRows = rows.filter(booking => {
    // compute end time = start + length (in ms)
    const bookingEnd = new Date(booking.bookingStart.getTime() + booking.bookingLength * 60 * 60 * 1000);
    // keep if it’s ongoing or in the future
    return bookingEnd >= now;
  });

  return activeRows;
}

function getPins_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Pins');
  const rows  = sheet.getDataRange().getValues().slice(1); // skip header row
  return rows.map(r => ({ pin: String(r[0]).trim(), allowBooking: String(r[1]).trim(), allowBookingDeletion: String(r[2]).trim() }));
}

function checkPin_AllowBooking_(pin) {
  return getPins_().some(row => row.pin === String(pin).trim() && row.allowBooking === 'yes');
}

function checkPin_AllowBookingDeletion_(pin) {
  return getPins_().some(row => row.pin === String(pin).trim() && row.allowBookingDeletion === 'yes');
}

function createBooking(bookingStart, bookingLength, tailNumber, pilotName, pin) {
  if (!checkPin_AllowBooking_(pin)) {
    return 'Error: Invalid pin or booking creation not allowed.';
  }

  const sheet = SpreadsheetApp.getActive().getSheetByName('Bookings');
  sheet.appendRow([ Utilities.getUuid(), new Date(), bookingStart, bookingLength, tailNumber, pilotName ]);
  // For some reason passing JSON array as is doesn't work on the client, so stringifying it here and parsing on the client.
  return JSON.stringify(getBookings_()); 
}

function deleteBooking(id, pin) {
  if (!checkPin_AllowBookingDeletion_(pin)) {
    return 'Error: Invalid pin or booking deletion not allowed.';
  }

  const sheet = SpreadsheetApp.getActive().getSheetByName('Bookings');
  const rows  = sheet.getDataRange().getValues();

  // Find the row
  id = String(id).toLowerCase();
  for (let i = 1; i < rows.length; i++) {
    const rowId = String(rows[i][0]).toLowerCase();
    if (rowId === id) {
      sheet.deleteRow(i + 1); // +1 for header, +1 for row indices being 1-based
      return JSON.stringify(getBookings_());
    }
  }

  // If we get here, no matching timestamp was found
  return `Error: Booking not found for id ${id}`;
}