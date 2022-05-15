import getConfig from "next/config";
import { useState, useEffect } from "react";
import ArrowLink from "@/components/interactive/links/ArrowLink";
import { useRouter } from "next/router";
const { publicRuntimeConfig } = getConfig();
const { name } = publicRuntimeConfig.site;
import { useForm, SubmitHandler } from "react-hook-form";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
type Inputs = {
  search: string;
};

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();

  if (res.status !== 200) {
    throw new Error(data.message);
  }
  return data;
};

const Home = () => {
  const router = useRouter();
  const { search } = router.query;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      search,
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    // redirect to /search/query
    const { search } = data;
    const url = `/search/${search}`;
    window.location.href = url;
  };

  // fetch from api
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showError, setShowError] = useState(false);
  const [cached, setCached] = useState(false);
  // fetch
  const fetchData = async (search: string) => {
    setLoading(true);
    setError(false);

    // time how long it takes
    const start = Date.now();
    try {
      const data = await fetcher(`/api/search/${search}`);

      // if the data is less than 1 second then set cached true
      if (Date.now() - start < 1000) {
        setCached(true);
      }

      setResults(data);
    } catch (e) {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (search) {
      fetchData(search);
    }
  }, [search]);

  return (
    <div className=" bg-stone-800 text-white flex flex-col">
      <div className="flex justify-between shadow-lg shadow-black/20">
        <div className="flex p-4">
          <span className="font-bold text-[2rem] mr-4">
            <a href="/">
              <span className="bg-gradient-to-br from-indigo-400 to-indigo-600 bg-clip-text font-extrabold text-transparent">
                Steals
              </span>
              .com
            </a>
          </span>

          <form onSubmit={handleSubmit(onSubmit)} className="mx-auto">
            <div className="mt-1 relative rounded-md shadow-sm mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-black sm:text-sm">
                  <FontAwesomeIcon icon={faSearch} />
                </span>
              </div>

              <input
                type="text"
                id="search"
                defaultValue={search}
                {...register("search")}
                className="focus:ring-indigo-500 h-[2.3rem] mt-0.5 ml-0.5 focus:border-indigo-500 block pl-7 sm:text-sm border-gray-300 rounded-xl text-black w-[30rem]"
                placeholder="Search for items"
              />
            </div>
          </form>
        </div>
        <span className="my-auto">
          <ArrowLink className="mr-8" href="/">
            Login
          </ArrowLink>
        </span>
      </div>
      {!(error || showError) ? (
        <SkeletonTheme borderRadius="2rem" duration={0.9}>
          {!loading && (
          <span className="ml-[11.7rem]">
            Method: {cached ? "cached" : "scraped"}
          </span>
          )}
          <div className="flex flex-col gap-3 ml-[11.3rem] pt-4">
            {!loading ? (
              results.map((item: any) => (
                <SearchResult
                  loading={loading}
                  title={item.title}
                  description={item.description}
                  link={item.link}
                  price={item.price}
                  priceRating={item.priceRating}
                  type={item.type}
                />
              ))
            ) : (
              <>
                <SearchResult loading={loading} />
                <SearchResult loading={loading} />
                <SearchResult loading={loading} />
                <SearchResult loading={loading} />
                <SearchResult loading={loading} />
              </>
            )}
          </div>
        </SkeletonTheme>
      ) : (
        <div className="h-screen flex">
          <span className="m-auto font-bold text-[1.5rem]">
            No results... Try again with a different query.
          </span>
        </div>
      )}
      ;
    </div>
  );
};
// optional data prop
function SearchResult(props: any) {
  return (
    <a href={`${props.link || "https://google.com"}`}>
      <div className="post m-2 p-3 shadow-lg shadow-black/30 rounded-xl h-[10rem] ">
        <div className="left-col">
          <div className="avatar mt-2">
            {props.loading && (
              <Skeleton
                circle
                height="100%"
                containerClassName="avatar-skeleton"
              />
            )}
            <img
              src={
                props.type == "gumtree"
                  ? `data:image/jpeg;base64,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`
                  : `https://www.pngmart.com/files/15/EBay-Logo-PNG-Picture.png`
              }
              style={{ display: props.loading ? "none" : undefined }}
            />
          </div>
          <div className="user-name">
            {/* if price rating is good make it green
            if price rating is ok then make it yellow
            if price rating is bad make it orange
            if price rating is very bad make it red */}
            {props.loading ? (
              <Skeleton width={70} />
            ) : (
              <span
                className={`text-${
                  props.priceRating === "good"
                    ? "green"
                    : props.priceRating === "ok" || props.priceRating === "bad"
                    ? "yellow"
                    : "red"
                }-500`}
              >
                ${props.price}
              </span>
            )}
          </div>
        </div>
        <div className="right-col">
          <h3>
            {props.loading ? (
              <Skeleton />
            ) : (
              <span className="font-bold line-clamp-1">{props.title}</span>
            )}
          </h3>
          <p className="line-clamp-4">
            {props.loading ? <Skeleton count={3} /> : <>{props.description}</>}
          </p>
        </div>
      </div>
    </a>
  );
}

function Ebay() {
  return (
    <span className="font-bold tracking-wide">
      <span className="text-red-500">E</span>
      <span className="text-blue-500">b</span>
      <span className="text-yellow-500">a</span>
      <span className="text-green-500">y</span>
    </span>
  );
}

function Gumtree() {
  return (
    <span className="font-bold tracking-wide text-green-500">Gumtree</span>
  );
}

export default Home;
