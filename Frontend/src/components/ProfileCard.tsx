import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

const ProfileCard = ({ profile }: { profile: ProfileData }) => {
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  const fields = [
    { label: "First Name", value: profile.firstName },
    { label: "Last Name", value: profile.lastName },
    { label: "Email", value: profile.email },
    { label: "Role", value: profile.role },
    { label: "Member Since", value: format(new Date(profile.createdAt), "MMMM d, yyyy") },
  ];

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="items-center text-center">
        <Avatar className="h-16 w-16 mb-2">
          <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <CardTitle>{profile.firstName} {profile.lastName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((f) => (
          <div key={f.label} className="flex justify-between border-b border-border pb-2 last:border-0">
            <span className="text-sm text-muted-foreground">{f.label}</span>
            <span className="text-sm font-medium text-foreground">{f.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
