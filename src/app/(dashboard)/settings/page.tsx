"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const [business, setBusiness] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    currency: "USD",
  });
  const [user, setUser] = useState({
    name: "",
    email: "",
  });
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [businessRes, userRes] = await Promise.all([
          fetch("/api/settings/business"),
          fetch("/api/settings/user"),
        ]);

        const businessData = await businessRes.json();
        const userData = await userRes.json();

        if (businessData.success) setBusiness(businessData.data);
        if (userData.success) setUser(userData.data);
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBusiness(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(business),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Business settings updated successfully" });
      } else {
        setMessage({ type: "error", text: "Failed to update business settings" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/settings/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...user, password: password || undefined }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "User profile updated successfully" });
        setPassword("");
      } else {
        setMessage({ type: "error", text: "Failed to update user profile" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setIsSavingUser(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your business and account settings</p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-md ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-8">
        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Update your business details used on quotes and invoices</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateBusiness}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={business.name || ""}
                    onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-email">Business Email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={business.email || ""}
                    onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-phone">Phone Number</Label>
                  <Input
                    id="business-phone"
                    value={business.phone || ""}
                    onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-currency">Currency</Label>
                  <Input
                    id="business-currency"
                    value={business.currency || "USD"}
                    onChange={(e) => setBusiness({ ...business, currency: e.target.value })}
                    placeholder="USD, EUR, GBP, etc."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-address">Address</Label>
                <Textarea
                  id="business-address"
                  value={business.address || ""}
                  onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSavingBusiness}>
                {isSavingBusiness ? "Saving..." : "Save Business Settings"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* User Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Manage your personal information and password</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdateUser}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Full Name</Label>
                  <Input
                    id="user-name"
                    value={user.name || ""}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email Address</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={user.email || ""}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="user-password">New Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSavingUser}>
                {isSavingUser ? "Saving..." : "Save Profile"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
