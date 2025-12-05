"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { authClient } from "~/server/better-auth/client";

const ProfileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4.5C8.04416 4.5 4.75 7.79416 4.75 11.75C4.75 13.9113 5.48529 15.9392 6.77618 17.5223C7.57912 14.881 9.94059 13 12.75 13H11.25C9.45507 13 7.82855 14.0768 7.08643 15.656C5.5539 14.1506 4.75 12.0159 4.75 9.75C4.75 6.47761 7.47761 3.75 10.75 3.75C12.723 3.75 14.5492 4.67232 15.6881 6.25H16.25C16.9404 6.25 17.5 5.6904 17.5 5C17.5 4.3096 16.9404 3.75 16.25 3.75H15.6881C14.5492 2.1627 12.723 1.25 10.75 1.25C6.80416 1.25 3.5 4.55416 3.5 8.5C3.5 9.5165 3.75052 10.4907 4.22558 11.3653C5.11893 13.0645 6.74601 14.25 8.5625 14.25H9.5C9.91421 14.25 10.25 14.5858 10.25 15C10.25 15.4142 9.91421 15.75 9.5 15.75H8.5625C6.18241 15.75 4.14856 17.2655 3.42558 19.3347C4.71658 20.9178 6.64415 21.75 8.75 21.75C13.2941 21.75 17.0625 18.0441 17.0625 13.5H18.75C19.8248 13.5 20.75 12.5748 20.75 11.5V10.25C20.75 9.83579 20.4142 9.5 20 9.5C19.5858 9.5 19.25 9.83579 19.25 10.25V11.5C19.25 11.8459 18.9669 12.125 18.625 12.125H17.0625V13.5C17.0625 15.6989 15.8209 17.5505 14.075 18.4116C15.6178 17.6534 16.75 16.0355 16.75 14.125V13H17.8125C18.667 13 19.3125 12.3545 19.3125 11.5V10.25C19.3125 9.43579 18.667 8.75 17.8125 8.75H16.25C16.9404 8.75 17.5 8.1904 17.5 7.5C17.5 6.8096 16.9404 6.25 16.25 6.25H10.75C10.3358 6.25 10 6.58579 10 7C10 7.41421 10.3358 7.75 10.75 7.75C12.3941 7.75 13.75 9.1059 13.75 10.75C13.75 12.3941 12.3941 13.75 10.75 13.75C9.1059 13.75 7.75 12.3941 7.75 10.75C7.75 9.1059 9.1059 7.75 10.75 7.75Z"
      fill="currentColor"
    />
  </svg>
);

const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.4858 3.5L13.5182 3.5C13.9233 3.5 14.2518 3.82851 14.2518 4.23377C14.2518 5.9529 16.1129 7.02795 17.602 6.1682C17.9528 5.96567 18.4014 6.08586 18.6039 6.43667L20.1203 9.0631C20.3229 9.41407 20.2027 9.86286 19.8517 10.0655C18.3625 10.9253 18.3625 13.0747 19.8517 13.9345C20.2026 14.1372 20.3229 14.5859 20.1203 14.9369L18.6039 17.5634C18.4013 17.9142 17.9528 18.0344 17.602 17.8318C16.1129 16.9721 14.2518 18.0471 14.2518 19.7663C14.2518 20.1715 13.9233 20.5 13.5182 20.5H10.4858C10.0804 20.5 9.75182 20.1714 9.75182 19.766C9.75182 18.0461 7.88983 16.9717 6.40067 17.8314C6.04945 18.0342 5.60037 17.9139 5.39767 17.5628L3.88167 14.937C3.67903 14.586 3.79928 14.1372 4.15026 13.9346C5.63949 13.0748 5.63946 10.9253 4.15025 10.0655C3.79926 9.86282 3.67901 9.41401 3.88165 9.06303L5.39764 6.43725C5.60034 6.08617 6.04943 5.96581 6.40065 6.16858C7.88982 7.02836 9.75182 5.9539 9.75182 4.23399C9.75182 3.82862 10.0804 3.5 10.4858 3.5ZM13.5182 2L10.4858 2C9.25201 2 8.25182 3.00019 8.25182 4.23399C8.25182 4.79884 7.64013 5.15215 7.15065 4.86955C6.08213 4.25263 4.71559 4.61859 4.0986 5.68725L2.58261 8.31303C1.96575 9.38146 2.33183 10.7477 3.40025 11.3645C3.88948 11.647 3.88947 12.3531 3.40026 12.6355C2.33184 13.2524 1.96578 14.6186 2.58263 15.687L4.09863 18.3128C4.71562 19.3814 6.08215 19.7474 7.15067 19.1305C7.64015 18.8479 8.25182 19.2012 8.25182 19.766C8.25182 20.9998 9.25201 22 10.4858 22H13.5182C14.7519 22 15.7518 20.9998 15.7518 19.7663C15.7518 19.2015 16.3632 18.8487 16.852 19.1309C17.9202 19.7476 19.2862 19.3816 19.9029 18.3134L21.4193 15.6869C22.0361 14.6185 21.6701 13.2523 20.6017 12.6355C20.1125 12.3531 20.1125 11.647 20.6017 11.3645C21.6701 10.7477 22.0362 9.38152 21.4193 8.3131L19.903 5.68667C19.2862 4.61842 17.9202 4.25241 16.852 4.86917C16.3632 5.15138 15.7518 4.79856 15.7518 4.23377C15.7518 3.00024 14.7519 2 13.5182 2ZM9.6659 11.9999C9.6659 10.7103 10.7113 9.66493 12.0009 9.66493C13.2905 9.66493 14.3359 10.7103 14.3359 11.9999C14.3359 13.2895 13.2905 14.3349 12.0009 14.3349C10.7113 14.3349 9.6659 13.2895 9.6659 11.9999ZM12.0009 8.16493C9.88289 8.16493 8.1659 9.88191 8.1659 11.9999C8.1659 14.1179 9.88289 15.8349 12.0009 15.8349C14.1189 15.8349 15.8359 14.1179 15.8359 11.9999C15.8359 9.88191 14.1189 8.16493 12.0009 8.16493Z"
      fill="currentColor"
    />
  </svg>
);

interface AvatarProps {
  size?: "sm" | "md" | "lg";
  userImage: string | null;
  userName: string;
  getUserInitials: () => string;
}

const Avatar = ({
  size = "md",
  userImage,
  userName,
  getUserInitials,
}: AvatarProps) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-11 h-11 text-base",
  };

  const currentSize = sizeClasses[size];
  const imageSize = size === "lg" ? 44 : 40;

  return (
    <span className={`shrink-0 overflow-hidden rounded-full ${currentSize}`}>
      {userImage ? (
        <Image
          width={imageSize}
          height={imageSize}
          src={userImage}
          alt={userName}
          className="rounded-full object-cover"
        />
      ) : (
        <div
          className={`${currentSize} flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 font-semibold text-white`}
        >
          {getUserInitials()}
        </div>
      )}
    </span>
  );
};

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { data: session, isLoading } = authClient.useSession();

  const user = session?.user;
  const userName = user?.name || user?.firstName || "User";
  const userEmail = user?.email || "No email";
  const userImage = user?.image || null;

  const dropdownRef = useRef<HTMLDivElement>(null);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDropdown();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/";
          },
        },
      });
    } catch (error) {
      console.error("Sign out error:", error);
      window.location.href = "/";
    } finally {
      setIsSigningOut(false);
    }
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  if (isLoading) {
    return (
      <div className="flex items-center text-gray-700 dark:text-gray-400">
        <div className="mr-3 h-10 w-10 animate-pulse overflow-hidden rounded-full bg-gray-200 sm:h-11 sm:w-11 dark:bg-gray-700"></div>
        <div className="hidden space-y-1 sm:block">
          <div className="h-4 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-3 w-20 animate-pulse rounded-md bg-gray-300 dark:bg-gray-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center rounded-full p-1 text-gray-700 transition-colors duration-150 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        aria-expanded={isOpen}
        aria-controls="user-menu-dropdown"
        aria-label="User Account Menu"
      >
        <Avatar
          size="lg"
          userImage={userImage}
          userName={userName}
          getUserInitials={getUserInitials}
        />

        <div className="mx-3 hidden min-w-0 text-left md:block">
          <span className="block truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
            {userName}
          </span>
          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
            {user?.role === "admin" ? "Administrator" : "User"}
          </span>
        </div>

        <svg
          className={`mr-1 h-5 w-5 shrink-0 stroke-gray-500 transition-transform duration-200 md:ml-2 dark:stroke-gray-400 ${
            isOpen ? "rotate-180" : ""
          } hidden md:block`}
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        id="user-menu-dropdown"
        className="absolute right-0 z-50 mt-3 flex w-64 origin-top-right flex-col rounded-xl border border-gray-100 bg-white p-2 shadow-2xl shadow-gray-300/50 transition-opacity transition-transform md:w-[280px] dark:border-gray-700 dark:bg-gray-800 dark:shadow-black/50"
      >
        <div className="mb-2 flex items-center gap-3 border-b border-gray-100 p-2 dark:border-gray-700">
          <Avatar
            size="md"
            userImage={userImage}
            userName={userName}
            getUserInitials={getUserInitials}
          />
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
              {userName}
            </span>
            <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
              {userEmail}
            </span>
          </div>
        </div>

        <ul className="flex flex-col gap-1 pb-1">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/profile"
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/70"
            >
              <ProfileIcon className="h-5 w-5 text-gray-500 transition-colors group-hover:text-emerald-600 dark:text-gray-400 dark:group-hover:text-emerald-500" />
              Edit profile
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/settings"
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/70"
            >
              <SettingsIcon className="h-5 w-5 text-gray-500 transition-colors group-hover:text-emerald-600 dark:text-gray-400 dark:group-hover:text-emerald-500" />
              Account settings
            </DropdownItem>
          </li>

          {user?.role === "admin" && (
            <li>
              <DropdownItem
                onItemClick={closeDropdown}
                tag="a"
                href="/admin"
                className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/70"
              >
                <div className="h-5 w-5 text-gray-500 transition-colors group-hover:text-emerald-600 dark:text-gray-400 dark:group-hover:text-emerald-500">
                  <span className="text-xl">🛠️</span>
                </div>
                Admin Panel
              </DropdownItem>
            </li>
          )}

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/support"
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/70"
            >
              <div className="h-5 w-5 text-gray-500 transition-colors group-hover:text-emerald-600 dark:text-gray-400 dark:group-hover:text-emerald-500">
                <span className="text-xl">❓</span>
              </div>
              Support
            </DropdownItem>
          </li>
        </ul>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="mt-2 flex items-center justify-center gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-gray-600"
        >
          {isSigningOut ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
              <span className="text-red-700 dark:text-red-400">
                Signing out...
              </span>
            </>
          ) : (
            <>
              <svg
                className="h-5 w-5 fill-red-600 dark:fill-red-400"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
                  fill="currentColor"
                />
              </svg>
              Sign out
            </>
          )}
        </button>
      </Dropdown>
    </div>
  );
}
