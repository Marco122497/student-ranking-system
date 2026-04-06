"use client"

import { LoginForm } from "@/components/login-form"


export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex flex-col items-center gap-2 self-center font-medium">
          <div className="flex size-20 items-center justify-center  text-primary-foreground">
            <img src="/favicon.ico" alt="Icon" className="size-16" />
          </div>
          Christ the King College de Maranding, Inc.
        </a>
        <LoginForm />
      </div>
    </div>
  )
}
