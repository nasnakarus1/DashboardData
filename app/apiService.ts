import { GameDetails, SearchResult } from './types';

const API_BASE_URL = 'https://api.gamalytic.com'; // Remove the trailing slash
const API_KEY = process.env.NEXT_PUBLIC_GAMALYTICS_API_KEY;

async function fetchFromAPI(endpoint: string, params: Record<string, string | number> = {}) {
  const url = new URL(endpoint, API_BASE_URL);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value.toString());
  }

  console.log('Fetching from URL:', url.toString());

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'api-key': API_KEY || '',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export async function searchGames(query: string): Promise<SearchResult[]> {
  try {
    console.log('Searching for games with query:', query);
    const data = await fetchFromAPI('steam-games/list', { 
      title: query,
      unreleased: 'true'  // Add this line to include unreleased games
    });
    console.log('Search results:', data);
    return data.result.map((game: any) => ({
      steamId: game.steamId.toString(),
      name: game.name,
      price: game.price,
      followers: game.followers,
      reviewScore: game.reviewScore,
      unreleased: game.unreleased, // Add this line to include the unreleased status
      // Add other fields as needed
    }));
  } catch (error) {
    console.error('Error searching games:', error);
    throw error;
  }
}

export async function fetchGameDetails(gameId: string): Promise<GameDetails> {
  try {
    console.log('Fetching details for game ID:', gameId);
    const data = await fetchFromAPI(`game/${gameId}`);
    console.log('Game details:', data);
    
    let releaseDate: Date | null = null;
    if (data.releaseDate) {
      try {
        releaseDate = new Date(data.releaseDate * 1000);
        console.log('Release date:', releaseDate.toISOString(), 'Is within last year:', releaseDate >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
      } catch (dateError) {
        console.error('Error parsing release date:', dateError);
        console.log('Invalid release date value:', data.releaseDate);
      }
    }

    return {
      steamId: data.steamId,
      name: data.name,
      description: data.description,
      price: data.price,
      reviews: data.reviews,
      reviewsSteam: data.reviewsSteam,
      followers: data.followers,
      avgPlaytime: data.avgPlaytime,
      reviewScore: data.reviewScore,
      tags: data.tags,
      genres: data.genres,
      releaseDate: releaseDate,
      // Add other fields as per the API response
    };
  } catch (error) {
    console.error('Error fetching game details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

export async function fetchSimilarGames(game: GameDetails): Promise<GameDetails[]> {
  try {
    console.log('Fetching similar games for:', game.name);
    console.log('All Genres:', game.genres);
    console.log('All Tags:', game.tags);
    
    let allGames: any[] = [];
    let page = 1;
    let hasMorePages = true;

    // Use only the primary genre and top tag
    const primaryGenre = game.genres[0];
    const topTag = game.tags[0];
    console.log('Using primary genre:', primaryGenre);
    console.log('Using top tag:', topTag);

    while (hasMorePages) {
      let queryParams = {
        genres: primaryGenre,
        tags: topTag,
        limit: '100',
        page: page.toString(),
        price_min: 7.99,
      };

      console.log(`Fetching page ${page} with params:`, queryParams);

      let data = await fetchFromAPI('steam-games/list', queryParams);
      
      console.log(`API response for page ${page}:`, JSON.stringify(data, null, 2));
      console.log(`Number of games returned on page ${page}:`, data.result.length);

      if (data.result.length === 0) {
        console.log(`No more results found after page ${page - 1}`);
        hasMorePages = false;
      } else {
        allGames = allGames.concat(data.result);
        
        if (data.pages <= page) {
          console.log(`Reached last available page (${page})`);
          hasMorePages = false;
        } else {
          page++;
        }
      }
    }

    console.log('Total number of games fetched:', allGames.length);

    // Log details of first 10 games (to avoid console overload)
    allGames.slice(0, 10).forEach((game: any, index: number) => {
      console.log(`Game ${index + 1}:`, {
        name: game.name,
        releaseDate: new Date(game.releaseDate * 1000).toISOString(),
        price: game.price,
        followers: game.followers,
        reviewScore: game.reviewScore,
        genres: game.genres,
        tags: game.tags
      });
    });

    return allGames.map((game: any) => ({
      steamId: game.steamId.toString(),
      name: game.name,
      price: game.price || 0,
      followers: game.followers || 0,
      reviewScore: game.reviewScore || 0,
      tags: game.tags || [],
      genres: game.genres || [],
      releaseDate: new Date(game.releaseDate * 1000),
      copiesSold: game.copiesSold || 0,
      revenue: game.revenue || 0,
      avgPlaytime: game.avgPlaytime || 0,
    }));
  } catch (error) {
    console.error('Error fetching similar games:', error);
    throw error;
  }
}

export function analyzeSimilarGames(games: GameDetails[]) {
  console.log('Analyzing similar games. Number of games:', games.length);
  console.log('Games to analyze:', games.map(g => `${g.name} (${g.releaseDate?.toISOString() || 'No release date'})`));

  if (games.length === 0) {
    console.warn('No games to analyze');
    return {
      totalGames: 0,
      avgRevenue: 0,
      avgPrice: 0,
      avgWishlists: 0,
      genreRanking: 0,
      avgReviewScore: 0,
      gamesData: []
    };
  }

  const totalGames = games.length;
  const totalRevenue = games.reduce((sum, game) => sum + (game.price * game.followers * 0.7), 0);
  const avgRevenue = totalRevenue / totalGames;
  const avgPrice = games.reduce((sum, game) => sum + game.price, 0) / totalGames;
  const avgWishlists = games.reduce((sum, game) => sum + game.followers, 0) / totalGames;
  const avgReviewScore = games.reduce((sum, game) => sum + (game.reviewScore || 0), 0) / totalGames;

  // Calculate genre ranking (simplified version)
  const genreRanking = Math.floor(Math.random() * 10) + 1; // Placeholder, replace with actual calculation

  const gamesData = games.map(game => ({
    revenue: game.price * game.followers * 0.7, // Simplified revenue calculation
    wishlists: game.followers
  }));

  console.log('Analysis complete. Total games:', totalGames);

  return {
    totalGames,
    avgRevenue,
    avgPrice,
    avgWishlists,
    genreRanking,
    avgReviewScore,
    gamesData
  };
}