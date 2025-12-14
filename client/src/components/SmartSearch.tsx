import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Calendar, Trophy, Users, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { useLocation } from "wouter";
import { Badge } from "./ui/badge";

interface SearchResult {
  id: string;
  type: "event" | "challenge" | "user";
  title: string;
  description?: string;
  imageUrl?: string;
  username?: string;
  status?: string;
  createdAt?: string;
  participantCount?: number;
  amount?: number;
}

interface SmartSearchProps {
  trigger?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export function SmartSearch({ 
  trigger, 
  placeholder = "Search events, challenges, users...",
  className = ""
}: SmartSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();

  // Debounced search query
  const { data: searchResults = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", { q: searchTerm }],
    enabled: searchTerm.length > 2 && isOpen,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Reset search when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    
    switch (result.type) {
      case "event":
        navigate(`/events/${result.id}`);
        break;
      case "challenge":
        navigate(`/challenges/${result.id}`);
        break;
      case "user":
        navigate(`/@${result.username}`);
        break;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "event": return <Calendar className="w-4 h-4 text-blue-500" />;
      case "challenge": return <Trophy className="w-4 h-4 text-purple-500" />;
      case "user": return <Users className="w-4 h-4 text-green-500" />;
      default: return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  const getResultBadge = (result: SearchResult) => {
    if (result.type === "event") {
      return (
        <Badge variant="secondary" className="text-xs">
          {result.participantCount || 0} participants
        </Badge>
      );
    }
    if (result.type === "challenge") {
      return (
        <Badge variant="outline" className="text-xs">
          ₦{result.amount?.toLocaleString() || 0}
        </Badge>
      );
    }
    if (result.type === "user") {
      return (
        <Badge variant="default" className="text-xs">
          @{result.username}
        </Badge>
      );
    }
    return null;
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const defaultTrigger = (
    <button className={`p-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors ${className}`}>
      <Search className="w-5 h-5" />
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl shadow-lg max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Smart Search</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {searchTerm.length <= 2 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Type at least 3 characters to search</p>
                <p className="text-sm">Find events, challenges, and users</p>
              </div>
            )}

            {searchTerm.length > 2 && isLoading && (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                <p>Searching...</p>
              </div>
            )}

            {searchTerm.length > 2 && !isLoading && searchResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No results found</p>
                <p className="text-sm">Try different keywords</p>
              </div>
            )}

            {(searchResults as SearchResult[]).map((result: SearchResult) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-600"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="mt-1">
                    {getResultIcon(result.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {result.title}
                      </h4>
                      {getResultBadge(result)}
                    </div>
                    
                    {result.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                        {result.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(result.createdAt)}</span>
                      <span className="capitalize">{result.type}</span>
                      {result.status && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{result.status}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          {searchTerm.length > 2 && !isLoading && (
            <div className="border-t border-gray-200 dark:border-slate-600 pt-3">
              <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/events/create");
                  }}
                  className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Create Event
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/challenges");
                  }}
                  className="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                >
                  New Challenge
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}