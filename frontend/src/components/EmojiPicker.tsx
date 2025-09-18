import React, { useState, useEffect } from 'react';
import { emojiAPI } from '../services/api';
import { EmojiCategory } from '../types';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  const [categories, setCategories] = useState<EmojiCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Smileys & Emotion');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick access emojis
  const quickEmojis = ['👍', '❤️', '😄', '🎉', '👏', '🔥', '💯', '✅'];

  useEffect(() => {
    loadEmojis();
  }, []);

  const loadEmojis = async () => {
    try {
      const response = await emojiAPI.getCategories();
      setCategories(response.data);
      if (response.data.length > 0) {
        setSelectedCategory(response.data[0].category);
      }
    } catch (error) {
      console.error('Error loading emojis:', error);
      // Fallback emojis
      setCategories([
        {
          category: 'Quick',
          emojis: quickEmojis.map(emoji => ({ emoji, name: '', category: 'Quick' }))
        }
      ]);
    }
  };

  const filteredEmojis = () => {
    if (searchQuery) {
      const allEmojis = categories.flatMap(cat => cat.emojis);
      return allEmojis.filter(emoji => 
        emoji.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    const category = categories.find(cat => cat.category === selectedCategory);
    return category?.emojis || [];
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-80"
         onClick={(e) => e.stopPropagation()}>
      {/* Search */}
      <div className="mb-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search emojis..."
          className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slack-purple"
        />
      </div>

      {/* Quick Access */}
      <div className="mb-2 pb-2 border-b border-gray-200">
        <div className="text-xs text-gray-500 mb-1">Frequently Used</div>
        <div className="grid grid-cols-8 gap-1">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="p-1.5 hover:bg-gray-100 rounded text-xl"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && categories.length > 0 && (
        <div className="flex space-x-2 mb-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                selectedCategory === cat.category
                  ? 'bg-slack-purple text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.category}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="max-h-60 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {filteredEmojis().map((emoji, index) => (
            <button
              key={`${emoji.emoji}-${index}`}
              onClick={() => onSelect(emoji.emoji)}
              className="p-1.5 hover:bg-gray-100 rounded text-xl"
              title={emoji.name}
            >
              {emoji.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
