import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">QuickPoll</h1>
          <p className="text-muted-foreground">Real-time opinion polling</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
