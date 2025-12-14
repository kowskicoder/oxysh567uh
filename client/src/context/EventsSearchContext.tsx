import React, { createContext, useContext, useState, ReactNode } from "react";

interface EventsSearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const EventsSearchContext = createContext<EventsSearchContextType | undefined>(undefined);

export const EventsSearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchTerm, setSearchTerm] = useState("");
  return (
    <EventsSearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {children}
    </EventsSearchContext.Provider>
  );
};

export const useEventsSearch = () => {
  const context = useContext(EventsSearchContext);
  if (!context) throw new Error("useEventsSearch must be used within EventsSearchProvider");
  return context;
};
