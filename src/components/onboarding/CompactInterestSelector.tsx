import React, { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Interest {
  id: string;
  name: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CompactInterestSelectorProps {
  question: {
    id: string;
    question_text_en: string;
    subtitle_en?: string;
    validation_rules?: {
      min_selections?: number;
      max_selections?: number;
    };
  };
  value: string[];
  onChange: (value: string[]) => void;
}

// Interest categories from the HTML
const CATEGORIES: Category[] = [
  { id: 'Popular', name: 'Popular', icon: 'popular' },
  { id: 'Topics', name: 'Topics', icon: 'topics' },
  { id: 'Creativity', name: 'Creativity', icon: 'creativity' },
  { id: 'Film & Literature', name: 'Film & Literature', icon: 'film' },
  { id: 'Music', name: 'Music', icon: 'music' },
  { id: 'Activities', name: 'Activities', icon: 'activities' },
  { id: 'Gaming', name: 'Gaming', icon: 'gaming' },
  { id: 'Food & Drink', name: 'Food & Drink', icon: 'food' },
  { id: 'Pets', name: 'Pets', icon: 'pets' },
  { id: 'Causes', name: 'Causes', icon: 'causes' },
  { id: 'Sports', name: 'Sports', icon: 'sports' },
  { id: 'Anime', name: 'Anime', icon: 'anime' },
];

// Comprehensive interests data from the HTML
const INTERESTS_DATA: Interest[] = [
  // Popular
  { id: 'music', name: 'Music', category: 'Popular' },
  { id: 'gaming', name: 'Gaming', category: 'Popular' },
  { id: 'movies', name: 'Movies', category: 'Popular' },
  { id: 'food', name: 'Food', category: 'Popular' },
  { id: 'outdoors', name: 'Outdoors', category: 'Popular' },
  { id: 'dogs', name: 'Dogs', category: 'Popular' },
  { id: 'anime', name: 'Anime', category: 'Popular' },
  { id: 'cooking', name: 'Cooking', category: 'Popular' },
  { id: 'comedy', name: 'Comedy', category: 'Popular' },
  { id: 'travel', name: 'Travel', category: 'Popular' },
  { id: 'dating', name: 'Dating', category: 'Popular' },
  { id: 'horror', name: 'Horror', category: 'Popular' },
  { id: 'funny', name: 'Funny', category: 'Popular' },
  { id: 'single', name: 'Single', category: 'Popular' },
  { id: 'cats', name: 'Cats', category: 'Popular' },
  { id: 'animals', name: 'Animals', category: 'Popular' },
  { id: 'art', name: 'Art', category: 'Popular' },
  { id: 'romance', name: 'Romance', category: 'Popular' },
  { id: 'longtermrelationship', name: 'Long term relationship', category: 'Popular' },
  { id: 'rock', name: 'Rock', category: 'Popular' },
  { id: 'memes', name: 'Memes', category: 'Popular' },
  { id: 'books', name: 'Books', category: 'Popular' },
  { id: 'fantasy', name: 'Fantasy', category: 'Popular' },
  { id: 'technology', name: 'Technology', category: 'Popular' },
  { id: 'concerts', name: 'Concerts', category: 'Popular' },
  { id: 'history', name: 'History', category: 'Popular' },
  { id: 'friends', name: 'Friends', category: 'Popular' },
  { id: 'learning', name: 'Learning', category: 'Popular' },
  { id: 'boardgames', name: 'Board games', category: 'Popular' },
  { id: 'rap', name: 'Rap', category: 'Popular' },
  { id: 'psychology', name: 'Psychology', category: 'Popular' },
  { id: 'photography', name: 'Photography', category: 'Popular' },
  { id: 'hiphop', name: 'Hip hop', category: 'Popular' },
  { id: 'science', name: 'Science', category: 'Popular' },
  { id: 'metal', name: 'Metal', category: 'Popular' },
  { id: 'drawing', name: 'Drawing', category: 'Popular' },
  { id: 'shortterm', name: 'Short term', category: 'Popular' },
  { id: 'videos', name: 'Videos', category: 'Popular' },
  { id: 'museums', name: 'Museums', category: 'Popular' },
  { id: 'action', name: 'Action', category: 'Popular' },
  { id: 'animation', name: 'Animation', category: 'Popular' },
  { id: 'writing', name: 'Writing', category: 'Popular' },
  { id: 'culture', name: 'Culture', category: 'Popular' },
  { id: 'singing', name: 'Singing', category: 'Popular' },
  { id: 'baking', name: 'Baking', category: 'Popular' },
  { id: 'crime', name: 'Crime', category: 'Popular' },
  { id: 'pop', name: 'Pop', category: 'Popular' },
  { id: 'philosophy', name: 'Philosophy', category: 'Popular' },
  { id: 'universe', name: 'Universe', category: 'Popular' },
  { id: 'casual', name: 'Casual', category: 'Popular' },

  // Topics (additional from HTML)
  { id: 'languages', name: 'Languages', category: 'Topics' },
  { id: 'gadgets', name: 'Gadgets', category: 'Topics' },
  { id: 'meditation', name: 'Meditation', category: 'Topics' },
  { id: 'relationshipadvice', name: 'Relationship advice', category: 'Topics' },
  { id: 'physics', name: 'Physics', category: 'Topics' },
  { id: 'mythology', name: 'Mythology', category: 'Topics' },
  { id: 'conspiracytheories', name: 'Conspiracy theories', category: 'Topics' },
  { id: 'showerthoughts', name: 'Shower thoughts', category: 'Topics' },
  { id: 'lifeadvice', name: 'Life advice', category: 'Topics' },
  { id: 'politics', name: 'Politics', category: 'Topics' },
  { id: 'debates', name: 'Debates', category: 'Topics' },
  { id: 'worldnews', name: 'World news', category: 'Topics' },
  { id: 'crypto', name: 'Crypto', category: 'Topics' },
  { id: 'news', name: 'News', category: 'Topics' },
  { id: 'archaeology', name: 'Archaeology', category: 'Topics' },

  // Creativity (additional from HTML)
  { id: 'design', name: 'Design', category: 'Creativity' },
  { id: 'cosplay', name: 'Cosplay', category: 'Creativity' },
  { id: 'dance', name: 'Dance', category: 'Creativity' },
  { id: 'fashion', name: 'Fashion', category: 'Creativity' },
  { id: 'painting', name: 'Painting', category: 'Creativity' },
  { id: 'crafts', name: 'Crafts', category: 'Creativity' },
  { id: 'makeup', name: 'Makeup', category: 'Creativity' },
  { id: 'beauty', name: 'Beauty', category: 'Creativity' },

  // Film & Literature (additional from HTML)
  { id: 'scifi', name: 'Sci-fi', category: 'Film & Literature' },
  { id: 'mystery', name: 'Mystery', category: 'Film & Literature' },
  { id: 'documentaries', name: 'Documentaries', category: 'Film & Literature' },
  { id: 'kdrama', name: 'K-drama', category: 'Film & Literature' },
  { id: 'drama', name: 'Drama', category: 'Film & Literature' },
  { id: 'television', name: 'Television', category: 'Film & Literature' },
  { id: 'poetry', name: 'Poetry', category: 'Film & Literature' },
  { id: 'filmmaking', name: 'Filmmaking', category: 'Film & Literature' },
  { id: 'bollywood', name: 'Bollywood', category: 'Film & Literature' },
  { id: 'realitytv', name: 'Reality TV', category: 'Film & Literature' },

  // Music (additional from HTML)
  { id: 'kpop', name: 'K-pop', category: 'Music' },
  { id: 'indie', name: 'Indie', category: 'Music' },
  { id: 'country', name: 'Country', category: 'Music' },
  { id: 'jazz', name: 'Jazz', category: 'Music' },
  { id: 'punk', name: 'Punk', category: 'Music' },
  { id: 'techno', name: 'Techno', category: 'Music' },
  { id: 'reggae', name: 'Reggae', category: 'Music' },
  { id: 'rnb', name: 'R&B', category: 'Music' },
  { id: 'classical', name: 'Classical', category: 'Music' },
  { id: 'blues', name: 'Blues', category: 'Music' },
  { id: 'house', name: 'House', category: 'Music' },
  { id: 'electronic', name: 'Electronic', category: 'Music' },
  { id: 'edm', name: 'EDM', category: 'Music' },
  { id: 'funk', name: 'Funk', category: 'Music' },
  { id: 'folk', name: 'Folk', category: 'Music' },
  { id: 'latin', name: 'Latin', category: 'Music' },
  { id: 'desi', name: 'Desi', category: 'Music' },

  // Activities (additional from HTML)
  { id: 'festivals', name: 'Festivals', category: 'Activities' },
  { id: 'partying', name: 'Partying', category: 'Activities' },
  { id: 'standup', name: 'Stand-up', category: 'Activities' },
  { id: 'theater', name: 'Theater', category: 'Activities' },
  { id: 'gardening', name: 'Gardening', category: 'Activities' },

  // Gaming (additional from HTML)
  { id: 'minecraft', name: 'Minecraft', category: 'Gaming' },
  { id: 'pokemon', name: 'Pokemon', category: 'Gaming' },
  { id: 'dungeonsanddragons', name: 'Dungeons and Dragons', category: 'Gaming' },
  { id: 'leagueoflegends', name: 'League of Legends', category: 'Gaming' },
  { id: 'chess', name: 'Chess', category: 'Gaming' },
  { id: 'oyunoynamak', name: 'Oyun oynamak', category: 'Gaming' },
  { id: 'fortnite', name: 'Fortnite', category: 'Gaming' },
  { id: 'ajedrez', name: 'Ajedrez', category: 'Gaming' },
  { id: 'brettspiele', name: 'Brettspiele', category: 'Gaming' },
  { id: 'starcraft', name: 'Starcraft', category: 'Gaming' },
  { id: 'giochidatavolo', name: 'Giochi da tavolo', category: 'Gaming' },
  { id: 'gamen', name: 'Gamen', category: 'Gaming' },
  { id: 'calabozosydragones', name: 'Calabozos y dragones', category: 'Gaming' },
  { id: 'valorant', name: 'Valorant', category: 'Gaming' },
  { id: 'xadrez', name: 'Xadrez', category: 'Gaming' },
  { id: 'bordspellen', name: 'Bordspellen', category: 'Gaming' },
  { id: 'genshinimpact', name: 'Genshin Impact', category: 'Gaming' },
  { id: 'videogame', name: 'Video game', category: 'Gaming' },
  { id: 'dnd', name: 'D&D', category: 'Gaming' },
  { id: 'schach', name: 'Schach', category: 'Gaming' },
  { id: 'donjonsetdragons', name: 'Donjons et dragons', category: 'Gaming' },
  { id: 'scacchi', name: 'Scacchi', category: 'Gaming' },
  { id: 'game', name: 'Game', category: 'Gaming' },
  { id: 'rpg', name: 'RPG', category: 'Gaming' },
  { id: 'boardgame', name: 'Board game', category: 'Gaming' },
  { id: 'catur', name: 'Catur', category: 'Gaming' },
  { id: 'pcgaming', name: 'PC gaming', category: 'Gaming' },
  { id: 'warhammer40k', name: 'Warhammer 40k', category: 'Gaming' },

  // Food & Drink (additional from HTML)
  { id: 'vegetarian', name: 'Vegetarian', category: 'Food & Drink' },
  { id: 'vegan', name: 'Vegan', category: 'Food & Drink' },

  // Pets (additional from HTML)
  { id: 'birds', name: 'Birds', category: 'Pets' },
  { id: 'fish', name: 'Fish', category: 'Pets' },

  // Causes (additional from HTML)
  { id: 'humanrights', name: 'Human rights', category: 'Causes' },
  { id: 'lgbtqally', name: 'LGBTQ+ ally', category: 'Causes' },
  { id: 'blacklivesmatter', name: 'Black Lives Matter', category: 'Causes' },
  { id: 'environmentalism', name: 'Environmentalism', category: 'Causes' },
  { id: 'feminism', name: 'Feminism', category: 'Causes' },
  { id: 'volunteering', name: 'Volunteering', category: 'Causes' },
  { id: 'transally', name: 'Trans ally', category: 'Causes' },
  { id: 'stopasianhate', name: 'Stop Asian hate', category: 'Causes' },

  // Sports (additional from HTML)
  { id: 'gym', name: 'Gym', category: 'Sports' },
  { id: 'football', name: 'Football', category: 'Sports' },
  { id: 'fitness', name: 'Fitness', category: 'Sports' },
  { id: 'sports', name: 'Sports', category: 'Sports' },
  { id: 'basketball', name: 'Basketball', category: 'Sports' },
  { id: 'hiking', name: 'Hiking', category: 'Sports' },
  { id: 'cricket', name: 'Cricket', category: 'Sports' },
  { id: 'badminton', name: 'Badminton', category: 'Sports' },
  { id: 'swimming', name: 'Swimming', category: 'Sports' },
  { id: 'boxing', name: 'Boxing', category: 'Sports' },
  { id: 'yoga', name: 'Yoga', category: 'Sports' },
  { id: 'running', name: 'Running', category: 'Sports' },
  { id: 'volleyball', name: 'Volleyball', category: 'Sports' },
  { id: 'cycling', name: 'Cycling', category: 'Sports' },
  { id: 'martialarts', name: 'Martial arts', category: 'Sports' },
  { id: 'weightlifting', name: 'Weightlifting', category: 'Sports' },
  { id: 'baseball', name: 'Baseball', category: 'Sports' },
  { id: 'skateboarding', name: 'Skateboarding', category: 'Sports' },
  { id: 'tennis', name: 'Tennis', category: 'Sports' },
  { id: 'hockey', name: 'Hockey', category: 'Sports' },
  { id: 'golf', name: 'Golf', category: 'Sports' },
  { id: 'pingpong', name: 'Ping pong', category: 'Sports' },
  { id: 'snowboarding', name: 'Snowboarding', category: 'Sports' },
  { id: 'skiing', name: 'Skiing', category: 'Sports' },
  { id: 'pilates', name: 'Pilates', category: 'Sports' },
  { id: 'gymnastics', name: 'Gymnastics', category: 'Sports' },
  { id: 'scubadiving', name: 'Scuba diving', category: 'Sports' },
  { id: 'surfing', name: 'Surfing', category: 'Sports' },
  { id: 'netball', name: 'Netball', category: 'Sports' },

  
  // Anime (additional from HTML)
  { id: 'onepiece', name: 'One Piece', category: 'Anime' },
  { id: 'naruto', name: 'Naruto', category: 'Anime' },
  { id: 'dragonball', name: 'Dragon Ball', category: 'Anime' },
  { id: 'animes', name: 'Animes', category: 'Anime' },
  { id: 'pesci', name: 'Pesci', category: 'Anime' },
  { id: 'yugioh', name: 'Yu-Gi-Oh', category: 'Anime' },
  { id: 'demonslayer', name: 'Demon Slayer', category: 'Anime' },
  { id: 'jogo', name: 'Jogo', category: 'Anime' },
  { id: 'berserk', name: 'Berserk', category: 'Anime' },
  { id: 'jujutsukaisen', name: 'Jujutsu Kaisen', category: 'Anime' },
  { id: 'attackontitan', name: 'Attack on Titan', category: 'Anime' },
  { id: 'onepieceanime', name: 'One Piece Anime', category: 'Anime' },
  { id: 'digimon', name: 'Digimon', category: 'Anime' },
  { id: 'gundam', name: 'Gundam', category: 'Anime' },
  { id: 'jojobizarreadventures', name: 'Jojo\'s Bizarre Adventures', category: 'Anime' },
  { id: 'jojosbizarreadventure', name: 'Jojo\'s Bizarre Adventure', category: 'Anime' },
  { id: 'bleach', name: 'Bleach', category: 'Anime' },
  { id: 'chainsawman', name: 'Chainsaw Man', category: 'Anime' },
  { id: 'myheroacademia', name: 'My Hero Academia', category: 'Anime' },
  { id: 'hunterxhunter', name: 'Hunter x Hunter', category: 'Anime' },
  { id: 'mangaanime', name: 'Manga Anime', category: 'Anime' },
  { id: 'haikyuu', name: 'Haikyuu', category: 'Anime' },
  { id: 'evangelion', name: 'Evangelion', category: 'Anime' },
  { id: 'deathnote', name: 'Death Note', category: 'Anime' },
  { id: 'jujustukaisen', name: 'Jujustu Kaisen', category: 'Anime' },
  { id: 'isekai', name: 'Isekai', category: 'Anime' },
  { id: 'fullmetalalchemist', name: 'Fullmetal Alchemist', category: 'Anime' },
  { id: 'anime90s', name: 'Anime 90s', category: 'Anime' },
  { id: 'jjk', name: 'JJK', category: 'Anime' },
  { id: 'sailormoon', name: 'Sailor Moon', category: 'Anime' },
];

// Relationship values data
const RELATIONSHIP_VALUES_DATA: Interest[] = [
  { id: 'trust', name: 'Trust', category: 'Core Values' },
  { id: 'communication', name: 'Communication', category: 'Core Values' },
  { id: 'honesty', name: 'Honesty', category: 'Core Values' },
  { id: 'respect', name: 'Respect', category: 'Core Values' },
  { id: 'loyalty', name: 'Loyalty', category: 'Core Values' },
  { id: 'kindness', name: 'Kindness', category: 'Core Values' },
  { id: 'emotionalintimacy', name: 'Emotional Intimacy', category: 'Core Values' },
  { id: 'vulnerability', name: 'Vulnerability', category: 'Core Values' },
  { id: 'supportiveness', name: 'Supportiveness', category: 'Core Values' },
  { id: 'empathy', name: 'Empathy', category: 'Core Values' },
  { id: 'patience', name: 'Patience', category: 'Core Values' },
  { id: 'forgiveness', name: 'Forgiveness', category: 'Core Values' },
  { id: 'compromise', name: 'Compromise', category: 'Core Values' },
  { id: 'teamwork', name: 'Teamwork', category: 'Core Values' },
  { id: 'sharedgoals', name: 'Shared Goals', category: 'Core Values' },

  { id: 'independence', name: 'Independence', category: 'Lifestyle' },
  { id: 'togetherness', name: 'Togetherness', category: 'Lifestyle' },
  { id: 'adventure', name: 'Adventure', category: 'Lifestyle' },
  { id: 'stability', name: 'Stability', category: 'Lifestyle' },
  { id: 'spontaneity', name: 'Spontaneity', category: 'Lifestyle' },
  { id: 'routine', name: 'Routine', category: 'Lifestyle' },
  { id: 'travel', name: 'Travel', category: 'Lifestyle' },
  { id: 'homebody', name: 'Homebody', category: 'Lifestyle' },
  { id: 'social', name: 'Social', category: 'Lifestyle' },
  { id: 'quietnights', name: 'Quiet Nights', category: 'Lifestyle' },

  { id: 'familyoriented', name: 'Family Oriented', category: 'Family & Future' },
  { id: 'marriage', name: 'Marriage', category: 'Family & Future' },
  { id: 'children', name: 'Children', category: 'Family & Future' },
  { id: 'childfree', name: 'Child-free', category: 'Family & Future' },
  { id: 'longterm', name: 'Long-term', category: 'Family & Future' },
  { id: 'casualdating', name: 'Casual Dating', category: 'Family & Future' },
  { id: 'partnership', name: 'Partnership', category: 'Family & Future' },
  { id: 'companionship', name: 'Companionship', category: 'Family & Future' },

  { id: 'physicalaffection', name: 'Physical Affection', category: 'Physical' },
  { id: 'intimacy', name: 'Intimacy', category: 'Physical' },
  { id: 'chemistry', name: 'Chemistry', category: 'Physical' },
  { id: 'attraction', name: 'Attraction', category: 'Physical' },
  { id: 'touch', name: 'Touch', category: 'Physical' },

  { id: 'growth', name: 'Growth', category: 'Personal Growth' },
  { id: 'selfimprovement', name: 'Self-improvement', category: 'Personal Growth' },
  { id: 'learning', name: 'Learning', category: 'Personal Growth' },
  { id: 'curiosity', name: 'Curiosity', category: 'Personal Growth' },
  { id: 'ambition', name: 'Ambition', category: 'Personal Growth' },
  { id: 'motivation', name: 'Motivation', category: 'Personal Growth' },

  { id: 'financialstability', name: 'Financial Stability', category: 'Practical' },
  { id: 'responsibility', name: 'Responsibility', category: 'Practical' },
  { id: 'reliability', name: 'Reliability', category: 'Practical' },
  { id: 'cleanliness', name: 'Cleanliness', category: 'Practical' },
  { id: 'organization', name: 'Organization', category: 'Practical' },

  { id: 'humor', name: 'Humor', category: 'Personality' },
  { id: 'playfulness', name: 'Playfulness', category: 'Personality' },
  { id: 'seriousness', name: 'Seriousness', category: 'Personality' },
  { id: 'optimism', name: 'Optimism', category: 'Personality' },
  { id: 'realism', name: 'Realism', category: 'Personality' },
  { id: 'creativity', name: 'Creativity', category: 'Personality' },
  { id: 'intellect', name: 'Intellect', category: 'Personality' },

  { id: 'sharedhobbies', name: 'Shared Hobbies', category: 'Interests' },
  { id: 'separateinterests', name: 'Separate Interests', category: 'Interests' },
  { id: 'qualitytime', name: 'Quality Time', category: 'Interests' },
  { id: 'sharedvalues', name: 'Shared Values', category: 'Interests' },

  { id: 'healthylifestyle', name: 'Healthy Lifestyle', category: 'Health & Wellness' },
  { id: 'fitness', name: 'Fitness', category: 'Health & Wellness' },
  { id: 'mentalhealth', name: 'Mental Health', category: 'Health & Wellness' },
  { id: 'selfcare', name: 'Self Care', category: 'Health & Wellness' },
  { id: 'worklifebalance', name: 'Work-Life Balance', category: 'Health & Wellness' },

  { id: 'tradition', name: 'Tradition', category: 'Beliefs & Values' },
  { id: 'modernity', name: 'Modernity', category: 'Beliefs & Values' },
  { id: 'spirituality', name: 'Spirituality', category: 'Beliefs & Values' },
  { id: 'religion', name: 'Religion', category: 'Beliefs & Values' },
  { id: 'open-mindedness', name: 'Open-mindedness', category: 'Beliefs & Values' },
];

export const CompactInterestSelector: React.FC<CompactInterestSelectorProps> = ({
  question,
  value,
  onChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Ensure question is valid
  if (!question || !question.id) {
    console.error('CompactInterestSelector: Invalid question object', question);
    return <div>Error: Invalid question data</div>;
  }

  // Get appropriate data based on question ID
  const allInterests = question.id === "relationship_values"
    ? RELATIONSHIP_VALUES_DATA
    : INTERESTS_DATA;

  // Ensure allInterests is an array
  if (!Array.isArray(allInterests)) {
    console.error('CompactInterestSelector: allInterests is not an array', allInterests);
    return <div>Error: Invalid interests data</div>;
  }

  // Get categories based on question type
  const categories = useMemo(() => {
    if (question.id === "relationship_values") {
      if (!Array.isArray(allInterests)) {
        console.error('CompactInterestSelector: allInterests is not an array when generating categories', allInterests);
        return [];
      }
      return Array.from(new Set(allInterests.map(i => i.category))).map(cat => ({ id: cat, name: cat, icon: cat.toLowerCase() }));
    }
    return CATEGORIES;
  }, [question.id, allInterests]);

  // Ensure categories is an array
  if (!Array.isArray(categories)) {
    console.error('CompactInterestSelector: categories is not an array', categories);
    return <div>Error: Invalid categories data</div>;
  }

  // Filter interests by search term only
  const filteredInterests = useMemo(() => {
    // Double-check that allInterests is an array
    if (!Array.isArray(allInterests)) {
      console.error('CompactInterestSelector: allInterests is not an array in filteredInterests', allInterests);
      return [];
    }

    let filtered = allInterests;

    // Only filter by search term
    if (searchTerm) {
      filtered = filtered.filter(interest =>
        interest.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [searchTerm, allInterests]);

  const selectedInterests = Array.isArray(value) ? value : [];

  const handleInterestClick = (interestId: string) => {
    const isSelected = selectedInterests.includes(interestId);
    const maxSelections = question.validation_rules?.max_selections;

    if (isSelected) {
      // Remove interest
      onChange(selectedInterests.filter(id => id !== interestId));
    } else if (!maxSelections || selectedInterests.length < maxSelections) {
      // Add interest
      onChange([...selectedInterests, interestId]);
    }
  };

  const handleRemoveSelected = (interestId: string) => {
    onChange(selectedInterests.filter(id => id !== interestId));
  };

  const minSelections = question.validation_rules?.min_selections || 5;
  const maxSelections = question.validation_rules?.max_selections;
  const isValid = selectedInterests.length >= minSelections;

  return (
    <div className="flex flex-col h-full max-h-full">
      {/* Title and Description - Only show at top */}
      <div className="flex flex-col gap-2 w-full p-4 pb-2">
        <h4 className="text-2xl font-medium mb-2">
          {question.question_text_en}
        </h4>
        <p className="text-sm text-muted-foreground">
          {question.subtitle_en || `Add at least ${minSelections} interests to your profile to connect with like-minded individuals.`}
        </p>
      </div>

      {/* Sticky Header with Search and Categories */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 w-full p-4 pt-2 bg-background/95 backdrop-blur-sm border-b">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search interests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 rounded-full bg-muted border-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Navigation */}
        <div className="flex gap-3 w-full overflow-x-auto pb-2 -mx-2 px-2">
          {Array.isArray(categories) && categories.map(category => (
            <button
              key={category.id}
              onClick={() => {
                // Smooth scroll to category
                const element = document.getElementById(`category-${category.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="px-4 py-2.5 min-w-max rounded-3xl text-sm font-medium transition-all duration-500 whitespace-nowrap bg-muted text-muted-foreground hover:bg-primary/20"
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sticky Header with Search, Categories, and Selected */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 w-full p-4 pt-2 bg-background/95 backdrop-blur-sm border-b">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search interests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 rounded-full bg-muted border-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Navigation */}
        <div className="flex gap-3 w-full overflow-x-auto pb-2 -mx-2 px-2">
          {Array.isArray(categories) && categories.map(category => (
            <button
              key={category.id}
              onClick={() => {
                // Smooth scroll to category
                const element = document.getElementById(`category-${category.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="px-4 py-2.5 min-w-max rounded-3xl text-sm font-medium transition-all duration-500 whitespace-nowrap bg-muted text-muted-foreground hover:bg-primary/20"
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Selected Interests - Sticky */}
        {selectedInterests.length > 0 && (
          <div className="bg-primary/5 border-y border-primary/20 p-4">
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {Array.isArray(selectedInterests) && selectedInterests.map(interestId => {
                const interest = allInterests.find(i => i.id === interestId);
                if (!interest) return null;
                return (
                  <div
                    key={interestId}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    <span className="text-sm font-medium">{interest.name}</span>
                    <button
                      onClick={() => handleRemoveSelected(interestId)}
                      className="ml-1 text-primary-foreground/80 hover:text-primary-foreground transition-colors rounded-sm p-0.5 hover:bg-primary-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Interests Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {searchTerm && (
          <div className="mb-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Results ({filteredInterests.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(filteredInterests) && filteredInterests.map(interest => {
                const isSelected = selectedInterests.includes(interest.id);
                const isDisabled = !isSelected && maxSelections && selectedInterests.length >= maxSelections;

                return (
                  <button
                    key={interest.id}
                    onClick={() => handleInterestClick(interest.id)}
                    disabled={isDisabled}
                    className={cn(
                      "px-2.5 py-1.5 text-xs leading-3 rounded-3xl transition-all duration-500",
                      "hover:scale-105 active:scale-95",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md"
                        : isDisabled
                          ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-black hover:shadow-sm cursor-pointer"
                    )}
                  >
                    #{interest.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!searchTerm && (
          <div className="space-y-6">
            {Array.isArray(categories) && categories.map(category => {
              // Get interests for this category
              const categoryInterests = filteredInterests.filter(i => i.category === category.id);

              // Skip empty categories
              if (categoryInterests.length === 0) return null;

              return (
                <div key={category.id} id={`category-${category.id}`} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <h3 className="font-medium">{category.name}</h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(categoryInterests) && categoryInterests.map(interest => {
                      const isSelected = selectedInterests.includes(interest.id);
                      const isDisabled = !isSelected && maxSelections && selectedInterests.length >= maxSelections;

                      return (
                        <button
                          key={interest.id}
                          onClick={() => handleInterestClick(interest.id)}
                          disabled={isDisabled}
                          className={cn(
                            "px-2.5 py-1.5 text-xs leading-3 rounded-3xl transition-all duration-500",
                            "hover:scale-105 active:scale-95",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md"
                              : isDisabled
                                ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                                : "bg-muted text-muted-foreground hover:bg-accent hover:text-black hover:shadow-sm cursor-pointer"
                          )}
                        >
                          #{interest.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredInterests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? "No interests found matching your search." : "No interests in this category."}
            </p>
          </div>
        )}
      </div>

      {/* Validation Status */}
      <div className="p-4 bg-background/95 backdrop-blur-sm border-t">
        <div className="text-center">
          <p className={cn(
            "text-sm font-medium",
            isValid ? "text-green-600" : "text-destructive"
          )}>
            {isValid
              ? `Great! You've selected ${selectedInterests.length} interest${selectedInterests.length !== 1 ? 's' : ''}`
              : `Please select at least ${minSelections} interest${minSelections !== 1 ? 's' : ''} to continue`
            }
          </p>
        </div>
      </div>
    </div>
  );
};