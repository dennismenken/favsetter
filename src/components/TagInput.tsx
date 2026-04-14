'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tagChipClass } from '@/lib/tagColor';

interface Tag {
  id: string;
  name: string;
  color?: string;
  _count?: {
    favorites: number;
  };
}

interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ label, value = [], onChange, placeholder = 'Add tags…', className }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.trim().length > 0) {
        try {
          const response = await fetch(`/api/tags?q=${encodeURIComponent(inputValue.trim())}`);
          if (response.ok) {
            const data = await response.json();
            const filteredSuggestions = data.tags.filter(
              (tag: Tag) => !value.includes(tag.name)
            );
            setSuggestions(filteredSuggestions);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }
        } catch (error) {
          console.error('Error fetching tag suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, value]);

  const addTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        addTag(suggestions[selectedIndex].name);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === ',' || e.key === ' ') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }
  };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
      )}

      {/* Tags Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {value.map((tag) => (
            <span key={tag} className={tagChipClass(tag)}>
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 -mr-0.5 hover:bg-[oklch(1_0_0/_0.12)] rounded-sm p-0.5 transition-colors"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={placeholder}
          className="w-full"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-2 card-glass overflow-hidden max-h-56 overflow-y-auto p-1"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => addTag(suggestion.name)}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm rounded-md transition-colors flex items-center justify-between gap-2',
                  selectedIndex === index
                    ? 'bg-[oklch(0.82_0.16_200/_0.14)] text-foreground'
                    : 'hover:bg-[oklch(1_0_0/_0.06)] text-foreground/85'
                )}
              >
                <span className="font-medium tracking-tight">{suggestion.name}</span>
                {suggestion._count && (
                  <span className="text-[0.65rem] font-mono text-muted-foreground">
                    {suggestion._count.favorites}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[0.7rem] text-muted-foreground/70 mt-2 font-mono">
        Enter, comma or space to add
      </p>
    </div>
  );
}
