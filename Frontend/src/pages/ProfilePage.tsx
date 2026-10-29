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

  return (
    <AppLayout>
      <div className="flex flex-1 items-start justify-center pt-12">
        {error ? (
          <p className="text-destructive">Failed to load user profile.</p>
        ) : !profile ? (
          <div className="w-full max-w-lg space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : (
          <ProfileCard profile={profile} />
        )}
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
