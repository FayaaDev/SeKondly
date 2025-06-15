import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  query: string;
  specialty: string;
  dateRange: string;
}

const specialties = [
  "Cardiology",
  "Dermatology", 
  "Emergency Medicine",
  "Endocrinology",
  "Gastroenterology",
  "Hematology",
  "Infectious Disease",
  "Nephrology",
  "Neurology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Surgery",
  "Urology"
];

const dateRanges = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "3months", label: "Last 3 Months" },
  { value: "6months", label: "Last 6 Months" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" }
];

export default function SearchModal({ isOpen, onClose, onSearch }: SearchModalProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    specialty: "",
    dateRange: ""
  });

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      specialty: "",
      dateRange: ""
    });
  };

  const hasActiveFilters = filters.query || filters.specialty || filters.dateRange;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 rounded-t-3xl rounded-b-none fixed bottom-0 left-0 right-0 transform translate-y-0 ios-modal">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Search Cases</DialogTitle>
            <Button
              variant="ghost"
              onClick={onClose}
              className="p-1 h-auto rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Search Query */}
          <div className="space-y-2">
            <Label htmlFor="search-query" className="text-sm font-medium">
              Keywords
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="search-query"
                placeholder="Search symptoms, diagnoses, treatments..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                className="pl-10 ios-input rounded-xl border-gray-200"
              />
            </div>
          </div>

          {/* Specialty Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Medical Specialty</Label>
            <Select
              value={filters.specialty}
              onValueChange={(value) => setFilters(prev => ({ ...prev, specialty: value }))}
            >
              <SelectTrigger className="ios-input rounded-xl border-gray-200">
                <SelectValue placeholder="All specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All specialties</SelectItem>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Time Period</Label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger className="ios-input rounded-xl border-gray-200">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                {dateRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1 rounded-xl border-gray-200"
              >
                Clear Filters
              </Button>
            )}
            <Button
              onClick={handleSearch}
              className="flex-1 bg-ios-blue hover:bg-blue-600 text-white rounded-xl"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-blue-800">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {filters.query && (
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                    "{filters.query}"
                  </div>
                )}
                {filters.specialty && (
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                    {filters.specialty}
                  </div>
                )}
                {filters.dateRange && (
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                    {dateRanges.find(r => r.value === filters.dateRange)?.label}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}