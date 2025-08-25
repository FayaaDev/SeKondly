import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, Search, Plus, Home as HomeIcon, FileText, User, Heart, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfilePictureModal from "@/components/ProfilePictureModal";
import CaseCard from "@/components/CaseCard";
import NewCaseModal from "@/components/NewCaseModal";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingActionButton from "@/components/FloatingActionButton";
import { MEDICAL_SPECIALTIES } from "@/constants/medical";
import SearchModal, { SearchFilters } from "@/components/SearchModal";
import CaseDetailModal from "@/components/CaseDetailModal";
import OnboardingFlow from "@/components/OnboardingFlow";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CaseWithAuthor, 
  User as UserType, 
  Notification, 
  UserWithFollowStats 
} from "@shared/schema";

type Tab = "feed" | "mycases" | "favorites" | "notifications" | "profile";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<Tab>("feed");
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCaseDetail, setShowCaseDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All Cases");
  const [specialtySearch, setSpecialtySearch] = useState<string>("");
  const [showSpecialtySuggestions, setShowSpecialtySuggestions] = useState<boolean>(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ query: "", specialty: "", dateRange: "" });
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<"followers" | "following">("followers");
  const { user, isLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // ALL HOOKS MUST BE DECLARED BEFORE ANY EARLY RETURNS
  
  // Check if user is approved
  useEffect(() => {
    if (user && !user.isApproved) {
      toast({
        title: "Account Pending",
        description: "Your account is still under review.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const { data: cases = [], isLoading: casesLoading, error: casesError } = useQuery<CaseWithAuthor[]>({
    queryKey: ["/api/cases"],
    enabled: !!user?.isApproved && !isSearchActive,
    retry: false,
  });

  // Search query
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<CaseWithAuthor[]>({
    queryKey: ["/api/cases/search", searchFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchFilters.query) params.append('query', searchFilters.query);
      if (searchFilters.specialty && searchFilters.specialty !== 'all') params.append('specialty', searchFilters.specialty);
      if (searchFilters.dateRange && searchFilters.dateRange !== 'all') params.append('dateRange', searchFilters.dateRange);
      
      const response = await fetch(`/api/cases/search?${params.toString()}`);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return await response.json() as CaseWithAuthor[];
    },
    enabled: !!user?.isApproved && isSearchActive,
    retry: false,
  });

  const { data: myCases = [], isLoading: myCasesLoading } = useQuery<CaseWithAuthor[]>({
    queryKey: ["/api/my-cases"],
    enabled: !!user?.isApproved && currentTab === "mycases",
    retry: false,
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user?.isApproved && currentTab === "notifications",
    retry: false,
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user?.isApproved,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false,
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<CaseWithAuthor[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user?.isApproved && currentTab === "favorites",
    retry: false,
  });

  const { data: myFollowStatus } = useQuery<UserWithFollowStats>({
    queryKey: [`/api/users/${user?.id}/follow-status`],
    enabled: !!user?.id && currentTab === "profile",
    retry: false,
  });

  const { data: myFollowers } = useQuery<UserType[]>({
    queryKey: [`/api/users/${user?.id}/followers`],
    enabled: !!user?.id && currentTab === "profile",
    retry: false,
  });

  const { data: myFollowing } = useQuery<UserType[]>({
    queryKey: [`/api/users/${user?.id}/following`],
    enabled: !!user?.id && currentTab === "profile",
    retry: false,
  });

  // NOW WE CAN HAVE CONDITIONAL RETURNS AFTER ALL HOOKS ARE DECLARED

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if user is not authenticated
  if (!user) {
    return <OnboardingFlow onComplete={() => window.location.reload()} />;
  }

  // Show pending approval screen if user is not approved
  if (!user.isApproved) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="text-yellow-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Under Review</h2>
          <p className="text-gray-600 mb-8">
            Your account is being reviewed. You'll be notified once approved.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={async () => {
                // Quick demo login for development
                try {
                  const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email: 'demo@medconnect.com', password: 'demo123' }),
                  });
                  if (response.ok) {
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Demo login failed:', error);
                }
              }}
              className="w-full mb-3"
            >
              Try Demo Account
            </Button>
            <Button 
              onClick={signOut}
              variant="outline"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // NOW WE CAN HAVE CONDITIONAL RETURNS AFTER ALL HOOKS ARE DECLARED

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if user is not authenticated
  if (!user) {
    return <OnboardingFlow onComplete={() => window.location.reload()} />;
  }

  // Show pending approval screen if user is not approved
  if (!user.isApproved) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="text-yellow-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Under Review</h2>
          <p className="text-gray-600 mb-8">
            Your account is being reviewed. You'll be notified once approved.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={async () => {
                // Quick demo login for development
                try {
                  const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email: 'demo@medconnect.com', password: 'demo123' }),
                  });
                  if (response.ok) {
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Demo login failed:', error);
                }
              }}
              className="w-full mb-3"
            >
              Try Demo Account
            </Button>
            <Button 
              onClick={signOut}
              variant="outline"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    switch (currentTab) {
      case "feed": return "Medical Cases";
      case "mycases": return "My Cases";
      case "favorites": return "Favorites";
      case "notifications": return "Notifications";
      case "profile": return "Profile";
      default: return "MedConnect";
    }
  };

  // Use search results if search is active, otherwise use regular cases
  const displayCases = isSearchActive ? searchResults : cases;
  
  // Filter cases by selected specialty (only when not searching)
  const filteredCases = React.useMemo(() => {
    let filtered = isSearchActive 
      ? searchResults
      : selectedSpecialty === "All Cases" 
        ? cases 
        : cases.filter((case_data) => case_data.specialty === selectedSpecialty);

    // Sort to ensure admin cases (from 'admin@sekondly.app') always appear last
    filtered.sort((a, b) => {
      const aIsAdmin = a.author?.email === 'admin@sekondly.app';
      const bIsAdmin = b.author?.email === 'admin@sekondly.app';
      
      // If one is admin and other is not, put non-admin first
      if (aIsAdmin && !bIsAdmin) return 1;
      if (!aIsAdmin && bIsAdmin) return -1;
      
      // If both are admin or both are user, maintain original order (by creation date)
      return 0;
    });
    
    return filtered;
  }, [isSearchActive, searchResults, selectedSpecialty, cases]);

  const specialties = ["All Cases", ...MEDICAL_SPECIALTIES];

  // Filter specialties based on search input
  const filteredSpecialties = specialtySearch 
    ? specialties.filter(specialty => 
        specialty.toLowerCase().includes(specialtySearch.toLowerCase())
      )
    : specialties;

  const handleSpecialtyFilter = (specialty: string) => {
    setSelectedSpecialty(specialty);
    setSpecialtySearch("");
    setShowSpecialtySuggestions(false);
  };

  const handleSpecialtySearchChange = (value: string) => {
    setSpecialtySearch(value);
    setShowSpecialtySuggestions(value.length > 0);
    
    // If the input exactly matches a specialty, apply the filter
    const exactMatch = specialties.find(specialty => 
      specialty.toLowerCase() === value.toLowerCase()
    );
    if (exactMatch) {
      setSelectedSpecialty(exactMatch);
    } else if (value === "") {
      setSelectedSpecialty("All Cases");
    }
  };

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setIsSearchActive(true);
    setShowSearchModal(false);
  };

  const clearSearch = () => {
    setSearchFilters({ query: "", specialty: "", dateRange: "" });
    setIsSearchActive(false);
    setSelectedSpecialty("All Cases");
  };

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative">
      {/* Header */}
      <header className="bg-white border-b border-ios-gray-light px-4 py-3 safe-area-inset-top sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-ios-gray p-2 h-auto"
              onClick={() => setShowSearchModal(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative text-ios-gray p-2 h-auto"
              onClick={() => setCurrentTab("notifications")}
            >
              <Bell className="h-5 w-5" />
              {unreadCount.count > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0 notification-badge">
                  {unreadCount.count > 9 ? "9+" : unreadCount.count}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="pb-20">
        {/* Feed Tab */}
        {currentTab === "feed" && (
          <div className="space-y-1">
            {/* Filter Bar */}
            <div className="px-4 py-3 bg-white border-b border-gray-100">
              {isSearchActive ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Search Results</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSearch}
                      className="text-xs"
                    >
                      Clear Search
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchFilters.query && (
                      <Badge variant="secondary" className="text-xs">
                        "{searchFilters.query}"
                      </Badge>
                    )}
                    {searchFilters.specialty && searchFilters.specialty !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {searchFilters.specialty}
                      </Badge>
                    )}
                    {searchFilters.dateRange && searchFilters.dateRange !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {searchFilters.dateRange}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search specialties (e.g. Card, Emer, Surg...)"
                    value={specialtySearch}
                    onChange={(e) => handleSpecialtySearchChange(e.target.value)}
                    onFocus={() => setShowSpecialtySuggestions(specialtySearch.length > 0)}
                    onBlur={() => setTimeout(() => setShowSpecialtySuggestions(false), 200)}
                    className="w-full rounded-lg border-gray-200 focus:border-ios-blue focus:ring-ios-blue"
                  />
                  
                  {/* Current Filter Display */}
                  {selectedSpecialty !== "All Cases" && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Filtering by:</span>
                      <Badge 
                        variant="default" 
                        className="bg-ios-blue text-white text-xs cursor-pointer hover:bg-ios-blue-dark"
                        onClick={() => handleSpecialtyFilter("All Cases")}
                      >
                        {selectedSpecialty} ✕
                      </Badge>
                    </div>
                  )}

                  {/* Suggestions Dropdown - only show when not in search mode */}
                  {showSpecialtySuggestions && filteredSpecialties.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {filteredSpecialties.map((specialty) => (
                        <button
                          key={specialty}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSpecialtyFilter(specialty)}
                        >
                          <span className="font-medium">{specialty}</span>
                          {specialty !== "All Cases" && (
                            <span className="text-xs text-gray-500 ml-2">Medical Specialty</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 space-y-4">
              {(casesLoading || (isSearchActive && searchLoading)) ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="ios-card rounded-xl p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                      <div className="h-32 bg-gray-200 rounded mb-3"></div>
                      <div className="flex space-x-4">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filteredCases.length === 0 ? (
                <Card className="ios-card rounded-xl p-8 text-center">
                  <FileText className="w-16 h-16 text-ios-gray mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {selectedSpecialty === "All Cases" ? "No cases available" : `No ${selectedSpecialty} cases`}
                  </h3>
                  <p className="text-ios-gray">
                    {selectedSpecialty === "All Cases" 
                      ? "Be the first to share a case!" 
                      : `No cases found for ${selectedSpecialty} specialty.`
                    }
                  </p>
                </Card>
              ) : (
                filteredCases.map((case_data: any) => (
                  <CaseCard 
                    key={case_data.id} 
                    case={case_data} 
                    onClick={() => {
                      setSelectedCase(case_data);
                      setShowCaseDetail(true);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* My Cases Tab */}
        {currentTab === "mycases" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">My Published Cases</h2>
              <span className="text-sm text-ios-gray">{myCases.length} cases</span>
            </div>
            
            {myCasesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="ios-card rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="flex space-x-4">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : myCases.length === 0 ? (
              <Card className="ios-card rounded-xl p-8 text-center">
                <FileText className="w-16 h-16 text-ios-gray mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No cases yet</h3>
                <p className="text-ios-gray mb-4">Start sharing your medical cases with colleagues.</p>
                <Button
                  onClick={() => setShowNewCaseModal(true)}
                  className="bg-ios-blue hover:bg-ios-blue-dark text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Share Your First Case
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {myCases.map((case_data: any) => (
                  <Card 
                    key={case_data.id} 
                    className="ios-card rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedCase(case_data);
                      setShowCaseDetail(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{case_data.title}</h3>
                      <Badge variant={case_data.isApproved ? "default" : "secondary"}>
                        {case_data.isApproved ? "Published" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-ios-gray mb-3">
                      {case_data.isApproved 
                        ? `Published ${new Date(case_data.approvedAt || case_data.createdAt).toLocaleDateString()}`
                        : `Submitted ${new Date(case_data.createdAt).toLocaleDateString()}`
                      }
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-ios-gray">
                      <span><Bell className="w-3 h-3 mr-1 inline" />{case_data.viewsCount || 0} views</span>
                      <span><FileText className="w-3 h-3 mr-1 inline" />{case_data.commentsCount || 0} comments</span>
                      <span><User className="w-3 h-3 mr-1 inline" />{case_data.likesCount || 0} likes</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {currentTab === "favorites" && (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-6">Favorite Cases</h2>
            
            {favoritesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="ios-card rounded-xl p-4 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <Card className="ios-card rounded-xl p-8 text-center">
                <Heart className="w-16 h-16 text-ios-gray mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                <p className="text-ios-gray">
                  Tap the heart icon on cases you'd like to save for later.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {favorites.map((case_data: any) => (
                  <CaseCard
                    key={case_data.id}
                    case={case_data}
                    onClick={() => {
                      setSelectedCase(case_data);
                      setShowCaseDetail(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {currentTab === "notifications" && (
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-6">Notifications</h2>
            
            {notificationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <Card className="ios-card rounded-xl p-8 text-center">
                <Bell className="w-16 h-16 text-ios-gray mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-ios-gray">You're all caught up!</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification: any) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-start space-x-3 p-3 rounded-xl ${
                      !notification.isRead ? "bg-medical-light" : ""
                    }`}
                  >
                    <div className="w-10 h-10 bg-ios-blue rounded-full flex items-center justify-center">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-sm text-ios-gray">{notification.message}</p>
                      <span className="text-xs text-ios-gray">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-ios-blue rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {currentTab === "profile" && (
          <div className="p-4">
            {/* Profile Header */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <ProfilePictureModal
                  imageUrl={user?.profileImageUrl || undefined}
                  userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                  size="lg"
                  className="mx-auto"
                />
              </div>
              <h2 className="text-xl font-semibold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-ios-gray">
                {user?.specialty} • {user?.experience}
              </p>
              <p className="text-sm text-ios-gray">{user?.institution}</p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="text-xl font-semibold">{myCases?.length || 0}</div>
                <div className="text-xs text-ios-gray">Cases</div>
              </div>
              <button 
                className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                onClick={() => {
                  setFollowModalType("followers");
                  setShowFollowModal(true);
                }}
              >
                <div className="text-xl font-semibold">{myFollowStatus?.followersCount || 0}</div>
                <div className="text-xs text-ios-gray">Followers</div>
              </button>
              <button 
                className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                onClick={() => {
                  setFollowModalType("following");
                  setShowFollowModal(true);
                }}
              >
                <div className="text-xl font-semibold">{myFollowStatus?.followingCount || 0}</div>
                <div className="text-xs text-ios-gray">Following</div>
              </button>
            </div>
            
            {/* Settings Menu */}
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full flex items-center justify-between p-4 ios-card rounded-xl h-auto"
                onClick={() => setLocation("/edit-profile")}
              >
                <div className="flex items-center space-x-3">
                  <User className="text-ios-gray w-4 h-4" />
                  <span>Edit Profile</span>
                </div>
                <span className="text-ios-gray">›</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full flex items-center justify-between p-4 ios-card rounded-xl h-auto"
                onClick={() => setLocation("/notification-settings")}
              >
                <div className="flex items-center space-x-3">
                  <Bell className="text-ios-gray w-4 h-4" />
                  <span>Notifications</span>
                </div>
                <span className="text-ios-gray">›</span>
              </Button>
              
              {user?.isAdmin && (
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-between p-4 ios-card rounded-xl h-auto"
                  onClick={() => window.location.href = "/admin-panel"}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="text-ios-gray w-4 h-4" />
                    <span>Admin Panel</span>
                  </div>
                  <span className="text-ios-gray">›</span>
                </Button>
              )}
              
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-4 ios-card rounded-xl h-auto text-red-500"
                onClick={async () => {
                  await fetch("/api/logout", { method: "POST", credentials: "include" });
                  window.location.href = "/";
                }}
              >
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4" />
                  <span>Sign Out</span>
                </div>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setShowNewCaseModal(true)} />

      {/* Bottom Navigation */}
      <BottomNavigation currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* New Case Modal */}
      <NewCaseModal 
        isOpen={showNewCaseModal} 
        onClose={() => setShowNewCaseModal(false)} 
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSearch={handleSearch}
      />

      {/* Case Detail Modal */}
      <CaseDetailModal
        isOpen={showCaseDetail}
        onClose={() => {
          setShowCaseDetail(false);
          setSelectedCase(null);
        }}
        caseData={selectedCase}
      />

      {/* Followers/Following Modal */}
      <Dialog open={showFollowModal} onOpenChange={setShowFollowModal}>
        <DialogContent className="w-full max-w-md mx-auto ios-modal">
          <DialogHeader>
            <DialogTitle className="text-center">
              {followModalType === "followers" ? "Followers" : "Following"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {followModalType === "followers" ? (
              myFollowers && myFollowers.length > 0 ? (
                <div className="space-y-3">
                  {myFollowers.map((follower: any) => (
                    <div key={follower.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => {
                      setShowFollowModal(false);
                      setLocation(`/profile/${follower.id}`);
                    }}>
                      <ProfilePictureModal
                        imageUrl={follower.profileImageUrl}
                        userName={`${follower.firstName || ''} ${follower.lastName || ''}`.trim() || follower.email}
                        size="sm"
                        className="w-10 h-10"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">
                          {follower.firstName && follower.lastName 
                            ? `${follower.firstName} ${follower.lastName}` 
                            : follower.email}
                        </h3>
                        {follower.specialty && (
                          <p className="text-xs text-ios-gray">{follower.specialty}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-ios-gray">
                  <p>No followers yet</p>
                </div>
              )
            ) : (
              myFollowing && myFollowing.length > 0 ? (
                <div className="space-y-3">
                  {myFollowing.map((following: any) => (
                    <div key={following.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => {
                      setShowFollowModal(false);
                      setLocation(`/profile/${following.id}`);
                    }}>
                      <ProfilePictureModal
                        imageUrl={following.profileImageUrl}
                        userName={`${following.firstName || ''} ${following.lastName || ''}`.trim() || following.email}
                        size="sm"
                        className="w-10 h-10"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">
                          {following.firstName && following.lastName 
                            ? `${following.firstName} ${following.lastName}` 
                            : following.email}
                        </h3>
                        {following.specialty && (
                          <p className="text-xs text-ios-gray">{following.specialty}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-ios-gray">
                  <p>Not following anyone yet</p>
                </div>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
