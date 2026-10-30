import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProfileCard from "@/components/ProfileCard";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/api";

const ProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => setProfile(res.data))
      .catch(() => setError(true));
  }, []);

  const renderContent = () => {
    if (error) {
      return <p className="text-destructive">Failed to load user profile.</p>;
    }
    if (!profile) {
      return (
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      );
    }
    return <ProfileCard profile={profile} />;
  };

  return (
    <AppLayout>
      <div className="flex flex-1 items-start justify-center pt-12">
        {renderContent()}
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
