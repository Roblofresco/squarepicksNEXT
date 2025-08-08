import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export type LoginFormProps = {
  email: string
  password: string
  isLoading?: boolean
  error?: string
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onSubmit: () => void
  onTogglePassword?: () => void
  showPassword?: boolean
}

export function LoginForm(props: LoginFormProps) {
  const {
    email,
    password,
    isLoading = false,
    error,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    onTogglePassword,
    showPassword,
  } = props

  return (
    <form
      id="login-form"
      className="w-full flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className="grid gap-3">
        <Label htmlFor="email">Email or Username</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Email or Username"
          required
        />
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Password"
            required
          />
          {onTogglePassword && (
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Logging in…' : 'Log In'}
      </Button>
    </form>
  )
} 