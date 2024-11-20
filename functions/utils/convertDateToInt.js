function convertDateToInt(releaseDate) {
  if (!releaseDate) return 0;
  
  const parts = releaseDate.split('-');
  const year = parts[0] || "0000";
  const month = parts[1]?.padStart(2, "0") || "00";
  const day = parts[2]?.padStart(2, "0") || "00";
  
  return parseInt(`${year}${month}${day}`);  // YYYYMMDD -> number
}

module.exports = convertDateToInt