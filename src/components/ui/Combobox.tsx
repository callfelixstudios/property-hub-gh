"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface ComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = "Select an option...",
  className = ""
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredOptions = query === ""
    ? options
    : options.filter(option =>
        option.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedIndex(0);
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % filteredOptions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex]);
          setIsOpen(false);
          setQuery("");
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div 
        className={`relative w-full bg-surface-primary border border-gray-200 rounded-sm flex items-center transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "focus-within:border-navy-light"
        }`}
      >
        <input
          type="text"
          className="w-full h-full px-4 py-3 text-navy-base bg-transparent outline-none disabled:cursor-not-allowed"
          value={isOpen ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={value ? value : placeholder}
          disabled={disabled}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="combobox-options"
          aria-autocomplete="list"
        />
        <div 
          className="pr-3 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600"
          onClick={() => {
            if (!disabled) setIsOpen(!isOpen);
          }}
        >
          <ChevronDown size={20} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {isOpen && (
        <ul
          id="combobox-options"
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-sm shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500 italic text-center">No options found.</li>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = value === option;
              const isHighlighted = highlightedIndex === index;
              return (
                <li
                  key={option}
                  role="option"
                  aria-selected={isSelected}
                  className={`px-4 py-3 text-sm flex items-center justify-between cursor-pointer transition-colors ${
                    isHighlighted ? "bg-gray-100 text-navy-base" : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className={isSelected ? "font-semibold text-navy-base" : ""}>{option}</span>
                  {isSelected && <Check size={16} className="text-navy-base" />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
