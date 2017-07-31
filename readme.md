# Scrape-CL

Scrape-CL is a webscraping research tool built to investigate co-housing craigslist ads. Using Google's Custom Search Engine API, the app finds all pertinent craigslist ads and pushes those links to an array of URLs. Then, using Cheerio and Request-Promise, it scrapes each craigslist page for the appropriate information and saves it into a MongoDB collection.

The data will be used later for a deeper analysis.
