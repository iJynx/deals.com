var JSSoup = require("jssoup").default;
const { CacheIndex } = require("../../../lib/cache");
// const mongoose = require("mongoose");

import { useMongoose } from "@codestra/next-serverless-mongoose";

async function scrapeGumtree(searchQuery: string) {
  const url = `https://www.gumtree.com.au/s-search-results.html?keywords=${searchQuery}&categoryId=&previousCategoryId=&locationStr=&locationId=0&radius=&sortByName=date&searchView=LIST&offerType=&priceType=&posterType=&topOnly=false&hpgOnly=false&highlightOnly=false&pageNum=1&action=default&maxPrice=&minPrice=&urgentOnly=false&categoryRedirected=true&pageSize=24`;
  const res = await fetch(url);
  const html = await res.text();

  const soup = new JSSoup(html);
  let results = soup.findAll("a", { class: "user-ad-row-new-design " });
  results = results.map((result: any) => {
    const title = result
      .find("p", {
        class: "user-ad-row-new-design__title",
      })
      .find("span", { class: "user-ad-row-new-design__title-span" }).text;

    const description = result
      .find("div", { class: "user-ad-row-new-design__description" })
      .find("p").text;

    const domain = "https://www.gumtree.com.au";
    const link = domain + result.attrs.href;

    const price = result
      .find("div", {
        class: "user-ad-row-new-design__right-content",
      })
      .find("div")
      .find("div", { class: "user-ad-price-new-design" })
      .find("span")
      .text.replace("$", "")
      .replace(",", "");

    return { title, description, link, price };
  });

  results = results.filter((result: any) => {
    const price = result.price;
    return !isNaN(parseFloat(price));
  });

  return results.map((result: any) => ({
    type: "gumtree",
    ...result,
  }));
}

async function scrapeEbay(searchQuery: string) {
  const url = `https://www.ebay.com.au/sch/i.html?_from=R40&_trksid=p2380057.m570.l1313&_nkw=${searchQuery}&_sacat=0`;

  const res = await fetch(url);
  const html = await res.text();

  const soup = new JSSoup(html);

  // get results
  let results = soup.findAll("div", { class: "s-item__info" });
  results = results.map((result: any) => {
    // find a
    const body = result.find("a", { class: "s-item__link" });
    const title = body.find("h3", { class: "s-item__title" }).text;
    const link = body.attrs.href;
    const description = result.find("div", { class: "s-item__subtitle" })
      ? result.find("div", { class: "s-item__subtitle" }).text
      : "No description";

    let price = result.find("span", { class: "s-item__price" }).text;
    // remove all non-number characters
    price = price.replace(/[^0-9\.]/g, "");

    return { title, link, description, price };
  });

  // filter out results that don't have a price
  results = results.filter((result: any) => {
    const price = result.price;
    return !isNaN(parseFloat(price));
  });

  return results.map((result: any) => ({
    type: "ebay",
    ...result,
  }));
}

// connect to database

export default function searchHandler({ query: { search } }: any, res: any) {
  useMongoose().then((mongoose: any) => {
    console.log(mongoose.connection.readyState);

    // getting results
    // searching database
    console.log("searching database");
    CacheIndex.findOne({ query: search }).then((cache: any) => {
      if (cache) {
        res.json(cache.results);
      } else {
        console.log("Starting scrape");

        const start = new Date().getTime();

        scrapeGumtree(search).then((gumtreeResults) => {
          scrapeEbay(search).then((ebayResults: any) => {
            const end = new Date().getTime();
            const time = end - start;
            console.log(`time to scrape: ${time}ms`);

            let results = gumtreeResults.concat(ebayResults);

            // simply all prices
            results = results.map((result: any) => {
              const price = result.price;
              return { ...result, price: parseInt(price) };
            });

            // remove anything that's 4 times over the average
            const average =
              results.reduce((acc: any, curr: { price: any }) => {
                return acc + curr.price;
              }, 0) / results.length;

            results = results.filter((result: any) => {
              const price = result.price;
              return price < average * 4;
            });

            results = results.sort((a: any, b: any) => {
              return a.price - b.price;
            });

            const minPrice = results[0].price;
            const maxPrice = results[results.length - 1].price;

            results = results.map((result: any) => {
              let priceScore =
                (parseFloat(result.price) - parseFloat(minPrice)) /
                (parseFloat(maxPrice) - parseFloat(minPrice));

              switch (true) {
                case priceScore <= 0.25:
                  result.priceRating = "good";
                  break;
                case priceScore <= 0.5:
                  result.priceRating = "ok";
                  break;
                case priceScore <= 0.75:
                  result.priceRating = "bad";
                  break;
                case priceScore <= 1:
                  result.priceRating = "very bad";
                  break;
                default:
                  result.priceRating = "unknown";
                  break;
              }

              // cache results
              const NewCacheIndex = new CacheIndex({
                query: search,
                results,
              });
              NewCacheIndex.save();

              return { ...result };
            });

            res.status(200).json(results);
          });
        });
      }
    });
  });
}
