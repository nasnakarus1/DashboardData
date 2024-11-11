"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';
import type { ChartData, ChartOptions } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartType,
  ScatterController,
  BarElement
} from 'chart.js';
import { searchGames, fetchGameDetails, fetchSimilarGames, analyzeSimilarGames } from "./apiService";
import { SearchResult, GameDetails } from "./types";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HeroVideoDialog from '@/components/ui/hero-video-dialog';
import { motion, AnimatePresence } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ScatterController,
  Title,
  Tooltip,
  Legend,
  BarElement
);

const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const Scatter = dynamic(() => import('react-chartjs-2').then(mod => mod.Scatter), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });

const SkeletonCard = () => (
  <div className="bg-[#080808] bg-opacity-50 backdrop-filter backdrop-blur-lg p-4 rounded-lg shadow-lg border border-gray-700 animate-pulse">
    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
    <div className="h-8 bg-gray-600 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-600 rounded w-1/4"></div>
  </div>
);

const SkeletonChart = () => (
  <div className="bg-[#080808] bg-opacity-50 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-lg border border-gray-700 animate-pulse">
    <div className="h-6 bg-gray-600 rounded w-1/2 mb-4"></div>
    <div className="h-64 bg-gray-600 rounded"></div>
  </div>
);

const avgPrices = [9.99, 14.99, 19.99, 24.99, 29.99, 39.99];

const generatePriceRevenueData = (analyzedData: any): ChartData<'line'> => {
  // This is a placeholder implementation. Adjust according to your actual data structure.
  return {
    labels: ['$9.99', '$14.99', '$19.99', '$24.99', '$29.99', '$39.99', '$49.99', '$59.99'],
    datasets: [{
      label: 'Revenue',
      data: [
        analyzedData.avgRevenue * 0.5,
        analyzedData.avgRevenue * 0.75,
        analyzedData.avgRevenue,
        analyzedData.avgRevenue * 1.25,
        analyzedData.avgRevenue * 1.5,
        analyzedData.avgRevenue * 1.75,
        analyzedData.avgRevenue * 2,
        analyzedData.avgRevenue * 2.25
      ],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4,
      fill: true,
    }]
  };
};

const generateRevenueDistributionData = (analyzedData: any): ChartData<'bar'> => {
  // This is a placeholder implementation. Adjust according to your actual data structure.
  return {
    labels: ['$0-$10k', '$10k-$50k', '$50k-$100k', '$100k-$500k', '$500k-$1M', '$1M+'],
    datasets: [{
      label: 'Percentage of Games',
      data: [30, 25, 20, 15, 7, 3], // Replace with actual calculated percentages
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };
};

export default function Home() {
  const chartRef = useRef<ChartJS<'line', number[], string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(7500);
  const [gamePrice, setGamePrice] = useState(19.99); // Default price of $19.99
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add a new state for debounce
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Add a useEffect for debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add a useEffect for auto-search
  useEffect(() => {
    const search = async () => {
      if (debouncedSearchTerm.length >= 2) { // Only search if query is at least 2 characters
        setIsSearching(true);
        setError(null);
        try {
          const results = await searchGames(debouncedSearchTerm);
          setSearchResults(results);
        } catch (error) {
          console.error("Error searching games:", error);
          setError("Failed to search games. Please try again.");
          toast.error("Failed to search games. Please try again.");
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    search();
  }, [debouncedSearchTerm]);

  // Keep the original estimateRevenue function
  const estimateRevenue = (count: number, price: number) => {
    // This is a simplified estimation. You might want to use a more complex formula.
    return count * price * 0.7; // Assuming 70% of wishlists convert to sales
  };

  useEffect(() => {
    if (chartRef.current) {
      console.log('Chart rendered');
    }
    // Simulate data fetching
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  const chartData: ChartData<'line'> = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Genre Popularity",
        data: [65, 70, 68, 75, 78, 82],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
    },
  };

  // Keep the options
  const priceRevenueOptions: ChartOptions<'line'> = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Price',
          color: 'rgba(255, 255, 255, 0.7)',
        },
        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
        grid: { display: false },
      },
      y: {
        display: false,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Revenue: $${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const revenueDistributionOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Percentage of Games',
          color: 'rgba(255, 255, 255, 0.7)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        }
      },
      x: {
        title: {
          display: true,
          text: 'Revenue Range',
          color: 'rgba(255, 255, 255, 0.7)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const dataIndex = context.dataIndex;
            return [
              `${context.parsed.y}% of games`,
              `Avg. Price: $${avgPrices[dataIndex].toFixed(2)}`
            ];
          }
        }
      }
    }
  };

  const [estimatedRevenue, setEstimatedRevenue] = useState(0);
  const [totalGames, setTotalGames] = useState(0);
  const [genreRanking, setGenreRanking] = useState(0);
  const [avgReviewScore, setAvgReviewScore] = useState(0);

  // Use the generate functions to create initial values
  const [priceRevenueData, setPriceRevenueData] = useState<ChartData<'line'>>(
    generatePriceRevenueData({ avgRevenue: 50000 }) // Use a default value
  );
  const [revenueDistributionData, setRevenueDistributionData] = useState<ChartData<'bar'>>(
    generateRevenueDistributionData({}) // Use empty object as default
  );

  // Add these state variables
  const [similarGamesData, setSimilarGamesData] = useState<{revenue: number, wishlists: number}[]>([]);
  const [userWishlistCount, setUserWishlistCount] = useState(7500);

  // Rename this function to estimateRevenueFromSimilarGames
  const estimateRevenueFromSimilarGames = (wishlistCount: number) => {
    if (similarGamesData.length === 0) {
      console.warn('No similar games data available for revenue estimation');
      // Remove the toast.warn call from here
      return 0;
    }

    // Simple linear regression model
    const totalWishlists = similarGamesData.reduce((sum, game) => sum + game.wishlists, 0);
    const totalRevenue = similarGamesData.reduce((sum, game) => sum + game.revenue, 0);
    const avgRevenuePerWishlist = totalRevenue / totalWishlists;

    return avgRevenuePerWishlist * wishlistCount;
  };

  const handleGameSelect = async (gameId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching details for game ID:', gameId);
      const gameDetails = await fetchGameDetails(gameId);
      console.log('Fetched game details:', gameDetails);
      setSelectedGame(gameDetails);
      setSearchResults([]); // Clear search results when a game is selected

      // Fetch similar games and analyze their data
      console.log('Fetching similar games');
      const similarGames = await fetchSimilarGames(gameDetails);
      console.log('Number of similar games fetched:', similarGames.length);

      const analyzedData = analyzeSimilarGames(similarGames);
      console.log('Analyzed data:', analyzedData);
      console.log('Number of games in analyzed data:', analyzedData.totalGames);

      // Update state with analyzed data
      setWishlistCount(Math.round(analyzedData.avgWishlists));
      setGamePrice(analyzedData.avgPrice);
      setEstimatedRevenue(Math.round(analyzedData.avgRevenue));
      setTotalGames(analyzedData.totalGames);
      setGenreRanking(analyzedData.genreRanking);
      setAvgReviewScore(analyzedData.avgReviewScore);

      // Log the state after updating
      console.log('Updated state:', {
        wishlistCount: Math.round(analyzedData.avgWishlists),
        gamePrice: analyzedData.avgPrice,
        estimatedRevenue: Math.round(analyzedData.avgRevenue),
        totalGames: analyzedData.totalGames,
        genreRanking: analyzedData.genreRanking,
        avgReviewScore: analyzedData.avgReviewScore
      });

      // Update chart data
      setPriceRevenueData(generatePriceRevenueData(analyzedData));
      setRevenueDistributionData(generateRevenueDistributionData(analyzedData));

      if (similarGames.length === 0) {
        console.warn('No similar games found');
        toast.warn('No similar games found. Revenue estimation may be inaccurate.');
      } else {
        console.log(`Found ${similarGames.length} similar games for analysis`);
        toast.success(`Found ${similarGames.length} similar games for analysis`);
      }

    } catch (error) {
      console.error("Error fetching game data:", error);
      if (error instanceof Error) {
        setError(`Failed to fetch game data: ${error.message}`);
        toast.error(`Failed to fetch game data: ${error.message}`);
      } else {
        setError("Failed to fetch game data. Please try again.");
        toast.error("Failed to fetch game data. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = () => {
    setSelectedGame(null);
    setSearchQuery("");
    setSearchResults([]);
    setSimilarGamesData([]);
    // Reset other state variables as needed
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Update the background to a black gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black"></div>
      
      {/* Remove the Particles component */}
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation bar */}
        <nav className="p-4 absolute top-0 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center">
            <div className="flex items-center mr-8">
              {/* GA logo */}
              <div className="text-3xl font-bold text-white">
                <span className="inline-block">G</span>
                <span className="inline-block -ml-1 -mt-2 relative" style={{ top: '0.2em' }}>A</span>
              </div>
            </div>
            <ul className="flex space-x-6 flex-grow">
              <li><a href="#how-to-use" className="text-gray-300 hover:text-white transition-colors">How to use</a></li>
              <li><a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#reviews" className="text-gray-300 hover:text-white transition-colors">Reviews</a></li>
              <li><a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
            </ul>
            <div className="flex space-x-4">
              <button className="text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors duration-300">
                Sign in
              </button>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors duration-300">
                Sign up
              </button>
            </div>
          </div>
        </nav>

        {/* Header and subheader */}
        <div className="w-full p-6 flex flex-col items-center justify-center min-h-[70vh]">
          {!isSearching && searchResults.length === 0 && !selectedGame && (
            <>
              <h1 className="text-7xl font-bold mb-8 text-center">
                <span className="bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
                  Know The Market For Your</span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  Game Idea </span>
                <span className="bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
                  Instantly
                </span>
              </h1>
              <p className="text-2xl text-gray-400 text-center max-w-3xl mb-12">
                Whether you have a game idea or an upcoming game steam page, we will give you market data and advisory instantly
              </p>
            </>
          )}
          <div className="flex flex-col items-center w-full max-w-3xl space-y-6">
            <div className="flex w-full">
              <input 
                type="text" 
                placeholder="Enter your game's name" 
                className="flex-grow px-6 py-3 rounded-full text-black focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={selectedGame !== null}
              />
              {selectedGame ? (
                <button
                  onClick={handleNewSearch}
                  className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors duration-300 ml-2"
                >
                  New Search
                </button>
              ) : (
                <button
                  onClick={() => {/* Add search function here */}}
                  className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors duration-300 ml-2"
                >
                  Search
                </button>
              )}
            </div>
            {isSearching && (
              <div className="text-white">Searching...</div>
            )}
            
            {/* Add vertical spacing here */}
            <div className="h-12"></div>
            
            {searchResults.length > 0 && !selectedGame && (
              <div className="w-full mt-4">
                <h3 className="text-white text-xl mb-2">Search Results:</h3>
                <ul className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-lg divide-y divide-gray-700">
                  {searchResults.map((game) => (
                    <li 
                      key={game.steamId} 
                      className="p-3 hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleGameSelect(game.steamId)}
                    >
                      <span className="text-white">{game.name}</span>
                      <span className="text-gray-400 ml-2">Price: ${game.price}</span>
                      <span className="text-gray-400 ml-2">Followers: {game.followers}</span>
                      <span className="text-gray-400 ml-2">Review Score: {game.reviewScore}</span>
                      {game.unreleased && <span className="text-yellow-400 ml-2">(Unreleased)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Display selected game info */}
            {selectedGame && (
              <div className="w-full mt-8 bg-gray-800 bg-opacity-70 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-lg border border-gray-700">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 mb-4 md:mb-0 md:mr-6">
                    <img 
                      src={selectedGame.headerImage || 'https://placehold.co/600x300?text=Game+Image'} 
                      alt={selectedGame.name} 
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                  </div>
                  <div className="md:w-2/3">
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedGame.name}</h2>
                    <p className="text-gray-300 mb-4">{selectedGame.description}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400">Price:</p>
                        <p className="text-2xl font-semibold text-green-400">${selectedGame.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Followers:</p>
                        <p className="text-2xl font-semibold text-purple-400">{selectedGame.followers.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">
                          {selectedGame.releaseDate && new Date(selectedGame.releaseDate) <= new Date() ? 'Revenue:' : 'Wishlist Count:'}
                        </p>
                        <p className="text-2xl font-semibold text-blue-400">
                          {selectedGame.releaseDate && new Date(selectedGame.releaseDate) <= new Date()
                            ? `$${selectedGame.revenue.toLocaleString()}`
                            : selectedGame.followers.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Release Date:</p>
                        <p className="text-xl font-semibold text-yellow-400">
                          {selectedGame.releaseDate ? new Date(selectedGame.releaseDate).toLocaleDateString() : 'TBA'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-gray-400 mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedGame.tags.slice(0, 5).map((tag, index) => (
                          <span key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <main className="flex-grow p-6">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard content */}
            <div className="flex-grow">
              {/* Estimated Revenue Based on Wishlist Milestones */}
              <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-lg shadow-lg border border-gray-700 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Estimated Revenue Based on Similar Games</h2>
                </div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-4xl font-bold text-purple-400">
                      {similarGamesData.length > 0 
                        ? `$${estimateRevenueFromSimilarGames(userWishlistCount).toLocaleString()}`
                        : 'No data'}
                    </p>
                    <p className="text-sm text-gray-400">Estimated Revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {userWishlistCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">Your Estimated Wishlists</p>
                  </div>
                </div>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    value={userWishlistCount}
                    onChange={(e) => setUserWishlistCount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>0</span>
                  <span>25,000</span>
                  <span>50,000</span>
                  <span>75,000</span>
                  <span>100,000</span>
                </div>
                <p className="text-sm text-gray-400 mt-4">
                  This estimate is based on the performance of similar games in the market.
                  Adjust the wishlist count to see potential revenue estimates.
                </p>
              </div>

              {/* Existing grid of smaller components */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {isLoading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : (
                  <>
                    {/* Avg. Revenue (Similar Games) */}
                    <div className="bg-[#080808] p-4 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-purple-500">
                      <h2 className="text-sm font-semibold text-gray-400 mb-2">Avg. Revenue (Similar Games)</h2>
                      <p className="text-3xl font-bold text-white mb-1">
                        {isLoading ? (
                          <span className="animate-pulse">Loading...</span>
                        ) : estimatedRevenue > 0 ? (
                          `$${estimatedRevenue.toLocaleString()}`
                        ) : (
                          'No data'
                        )}
                      </p>
                      <p className="text-sm text-gray-400 flex items-center">
                        Based on {totalGames} similar games
                      </p>
                    </div>

                    {/* Total Games */}
                    <div className="bg-[#080808] p-4 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-purple-500">
                      <h2 className="text-sm font-semibold text-gray-400 mb-2">Total Games</h2>
                      <p className="text-3xl font-bold text-white mb-1">12,345</p>
                      <p className="text-sm text-purple-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        +5% from last month
                      </p>
                    </div>

                    {/* Genre Ranking */}
                    <div className="bg-[#080808] p-4 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-purple-500">
                      <h2 className="text-sm font-semibold text-gray-400 mb-2">Genre Ranking</h2>
                      <p className="text-3xl font-bold text-white mb-1">#3</p>
                      <p className="text-sm text-purple-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        Up 2 spots from last month
                      </p>
                    </div>

                    {/* Avg. Price */}
                    <div className="bg-[#080808] p-4 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-purple-500">
                      <h2 className="text-sm font-semibold text-gray-400 mb-2">Avg. Price</h2>
                      <p className="text-3xl font-bold text-white mb-1">$24.99</p>
                      <p className="text-sm text-purple-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        -2% from last month
                      </p>
                    </div>

                    {/* Avg. Wishlists at Launch */}
                    <div className="bg-[#080808] p-4 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-purple-500">
                      <h2 className="text-sm font-semibold text-gray-400 mb-2">Avg. Wishlists at Launch</h2>
                      <p className="text-3xl font-bold text-white mb-1">5,000</p>
                      <p className="text-sm text-gray-400">For similar games</p>
                    </div>

                    {/* Wishlist-to-Sales Rate */}
                    <div className="bg-[#080808] p-4 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-purple-500">
                      <h2 className="text-sm font-semibold text-gray-400 mb-2">Wishlist-to-Sales Rate</h2>
                      <p className="text-3xl font-bold text-white mb-1">15.0%</p>
                      <p className="text-sm text-gray-400">Industry average: 10-20%</p>
                    </div>

                    {/* Avg. Wishlist Count */}
                    <div className="bg-[#080808] p-4 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-purple-500">
                      <h2 className="text-sm font-semibold text-gray-400 mb-2">Avg. Wishlist Count</h2>
                      <p className="text-3xl font-bold text-white mb-1">2,350</p>
                      <p className="text-sm text-purple-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        +10.1% from last month
                      </p>
                    </div>

                    {/* Similar Games (Last Year) */}
                    <div className="bg-[#080808] p-4 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-purple-500">
                      <h2 className="text-sm font-semibold text-gray-400 mb-2">Similar Games (Last Year)</h2>
                      <p className="text-3xl font-bold text-white mb-1">156</p>
                      <p className="text-sm text-purple-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                        </svg>
                        +20% from previous year
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {isLoading ? (
                  <>
                    <SkeletonChart />
                    <SkeletonChart />
                  </>
                ) : (
                  <>
                    {/* Price vs Revenue Chart and Revenue Distribution */}
                    <div className="space-y-6">
                      {/* Price vs Revenue Chart */}
                      <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl">
                        <h2 className="text-lg font-semibold mb-4 text-white">Price vs Revenue Correlation</h2>
                        <div className="h-48">
                          <Line data={priceRevenueData} options={priceRevenueOptions} />
                        </div>
                      </div>

                      {/* Revenue Distribution in Genre */}
                      <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl">
                        <h2 className="text-lg font-semibold mb-4 text-white">Revenue Distribution in Genre</h2>
                        <div className="h-48">
                          <Bar data={revenueDistributionData} options={revenueDistributionOptions} />
                        </div>
                      </div>
                    </div>

                    {/* AI Game Advisor */}
                    <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl">
                      <h2 className="text-lg font-semibold mb-4 text-white">AI Game Advisor</h2>
                      <div className="bg-gray-700 bg-opacity-50 backdrop-filter backdrop-blur-lg p-4 rounded-lg">
                        <p className="text-gray-300 mb-2">AI: Based on the dashboard data, here's a summary of your game's performance:</p>
                        <ul className="list-disc list-inside text-gray-300 mb-2 space-y-1">
                          <li>Your estimated revenue is ${estimateRevenue(wishlistCount, gamePrice).toLocaleString()} with {wishlistCount.toLocaleString()} wishlists.</li>
                          <li>The average revenue for similar games is $500.0k, which is 8% higher than last year.</li>
                          <li>Your genre is ranked #3, up 2 spots from last month.</li>
                          <li>The average price in your genre is $24.99, slightly down by 2% from last month.</li>
                          <li>The industry average wishlist-to-sales rate is 10-20%, and your game's rate is 15.0%.</li>
                          <li>There were 156 similar games released last year, a 20% increase from the previous year.</li>
                        </ul>
                        <p className="text-gray-300">Would you like more detailed insights on any specific aspect?</p>
                        <div className="flex mt-4">
                          <input type="text" placeholder="Ask for more details..." className="flex-grow bg-gray-600 bg-opacity-50 text-white p-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                          <button className="bg-purple-500 text-white p-2 rounded-r-lg hover:bg-purple-600 transition-colors duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Most Wishlisted Upcoming Games */}
              <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-xl mb-12">
                <h2 className="text-lg font-semibold mb-4 text-white">Most Wishlisted Upcoming Games</h2>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between">
                    <span className="text-gray-300">1. Cosmic Explorers 2</span>
                    <span className="text-purple-400">250,000 wishlists - Release: Oct 15, 2023</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-300">2. Neon Samurai: Cyberpunk Tales</span>
                    <span className="text-purple-400">220,000 wishlists - Release: Dec 1, 2023</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-300">3. Kingdoms & Castles: Legends</span>
                    <span className="text-purple-400">180,000 wishlists - Release: Nov 5, 2023</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-300">4. Pixel Pirate Adventures</span>
                    <span className="text-purple-400">150,000 wishlists - Release: Jan 20, 2024</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-300">5. Quantum Shift: Time Warp</span>
                    <span className="text-purple-400">130,000 wishlists - Release: Feb 14, 2024</span>
                  </li>
                </ul>
              </div>

              {/* How to Use Section */}
              <div id="how-to-use" className="p-12 rounded-lg mb-16">
                <h2 className="text-4xl font-bold text-center text-white mb-8">How to Use Gamanalyst</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <div className="text-center">
                    <div className="bg-purple-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H9m0 0V9a2 2 0 012 2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">1. Input Your Game Data</h3>
                    <p className="text-gray-300">Enter your game's details or connect your Steam page to get started.</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">2. Analyze Market Data</h3>
                    <p className="text-gray-300">Our AI analyzes market trends and provides insights specific to your game.</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">3. Get Actionable Insights</h3>
                    <p className="text-gray-300">Receive personalized recommendations to optimize your game's success.</p>
                  </div>
                </div>
                <div className="mt-12">
                  <HeroVideoDialog
                    animationStyle="from-bottom"
                    videoSrc="https://www.youtube.com/embed/your_video_id"
                    thumbnailSrc="/path/to/your/thumbnail.jpg"
                    thumbnailAlt="How to use Gamanalyst video thumbnail"
                    className="w-full max-w-4xl mx-auto"
                  />
                </div>
                <div className="text-center mt-12">
                  <button className="bg-purple-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-600 transition-colors duration-300">
                    Get Started Now
                  </button>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="p-12 rounded-lg mt-16">
                <h2 className="text-4xl font-bold text-center text-white mb-4">Choose Your Plan</h2>
                <p className="text-xl text-center text-gray-400 mb-12">Get the insights you need to make your game a success</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Basic Plan */}
                  <div className="bg-[#080808] p-8 rounded-xl shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-2xl hover:border-purple-500 flex flex-col">
                    <h3 className="text-2xl font-semibold text-white mb-4">Basic</h3>
                    <p className="text-4xl font-bold text-white mb-6">$9<span className="text-xl font-normal">/month</span></p>
                    <ul className="text-gray-300 mb-8 flex-grow">
                      <li className="mb-3 flex items-center"><svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Basic market insights</li>
                      <li className="mb-3 flex items-center"><svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Limited data analysis</li>
                      <li className="mb-3 flex items-center"><svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>1 game project</li>
                    </ul>
                    <button className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-600 transition-colors duration-300 transform hover:scale-105">
                      Choose Basic
                    </button>
                  </div>

                  {/* Pro Plan */}
                  <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-8 rounded-xl shadow-lg border border-purple-500 transition-all duration-300 hover:shadow-2xl transform hover:scale-105 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-lg font-semibold">Popular</div>
                    <h3 className="text-2xl font-semibold text-white mb-4">Pro</h3>
                    <p className="text-4xl font-bold text-white mb-6">$29<span className="text-xl font-normal">/month</span></p>
                    <ul className="text-gray-200 mb-8 flex-grow">
                      <li className="mb-3 flex items-center"><svg className="w-5 h-5 mr-2 text-purple-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Advanced market insights</li>
                      <li className="mb-3 flex items-center"><svg className="w-5 h-5 mr-2 text-purple-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Full data analysis</li>
                      <li className="mb-3 flex items-center"><svg className="w-5 h-5 mr-2 text-purple-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>5 game projects</li>
                      <li className="mb-3 flex items-center"><svg className="w-5 h-5 mr-2 text-purple-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>AI-powered recommendations</li>
                    </ul>
                    <button className="w-full bg-white text-purple-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 transform hover:scale-105">
                      Choose Pro
                    </button>
                  </div>

                  {/* Enterprise Plan */}
                  <div className="bg-[#080808] p-8 rounded-xl shadow-lg border border-gray-700 transition-all duration-300 hover:shadow-2xl hover:border-purple-500 flex flex-col">
                    <h3 className="text-2xl font-semibold text-white mb-4">Enterprise</h3>
                    <p className="text-4xl font-bold text-white mb-6">Custom</p>
                    <ul className="text-gray-300 mb-8 flex-grow">
                      <li className="mb-3 flex items-center"><svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Custom market insights</li>
                      <li className="mb-3 flex items-center"><svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Advanced data analysis</li>
                      <li className="mb-3 flex items-center"><svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Unlimited game projects</li>
                      <li className="mb-3 flex items-center"><svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Dedicated support</li>
                      <li className="mb-3 flex items-center"><svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Custom integrations</li>
                    </ul>
                    <button className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-600 transition-colors duration-300 transform hover:scale-105">
                      Contact Us
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add ToastContainer for notifications */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      
      {/* Display error message if there's an error */}
      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
    </div>
  );
}