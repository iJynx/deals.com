import getConfig from "next/config";

import ArrowLink from "@/components/interactive/links/ArrowLink";

const { publicRuntimeConfig } = getConfig();
const { name } = publicRuntimeConfig.site;
import { useForm, SubmitHandler } from "react-hook-form";

type Inputs = {
  search: string;
};

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

const Home = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = (data) => {
    // redirect to /search/query
    const { search } = data;
    const url = `/search/${search}`;
    window.location.href = url;
  };

  return (
    <div className="h-screen w-screen bg-stone-800 text-white flex flex-col">
      <div className="flex">
        <span className="ml-auto">
          <ArrowLink className="m-4" href="/">
            Login
          </ArrowLink>
        </span>
      </div>

      <div className="flex flex-col my-auto text-center">
        <span className="-mt-12 font-bold text-[3rem]">
          <span className="bg-gradient-to-br from-indigo-400 to-indigo-600 bg-clip-text font-extrabold text-transparent">
            Steals
          </span>
          .com
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
              {...register("search")}
              className="focus:ring-indigo-500 ml-0.5 focus:border-indigo-500 block pl-7 pr-12 sm:text-sm border-gray-300 rounded-xl text-black w-[30rem]"
              placeholder="Search for items"
            />
          </div>
        </form>
        <span className="mt-2">Gumtree, Etsy, eBay</span>
      </div>
    </div>
  );
};

export default Home;
