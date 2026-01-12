declare module '#auth-utils' {
  interface User {
    id: string
    googleId: string
    email: string
    name: string
    avatarUrl?: string
  }
}

export {}
