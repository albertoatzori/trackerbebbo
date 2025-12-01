import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { LogIn, UserPlus, Mail, Lock } from 'lucide-react'

export default function Auth() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password })
                if (error) throw error
                alert('Check your email for the login link!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
            }
        } catch (error) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="4" />
                            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Kanto Tracker</h1>
                    <p className="text-neutral-400">Track your Pokémon card collection</p>
                </div>

                {/* Card Container */}
                <div className="bg-neutral-900 rounded-[28px] p-6 shadow-2xl">
                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 p-1 bg-neutral-800 rounded-full">
                        <button
                            onClick={() => setIsSignUp(false)}
                            className={`flex-1 py-2.5 px-4 rounded-full font-medium transition-all duration-200 ${!isSignUp
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <LogIn className="w-4 h-4" />
                                Sign In
                            </span>
                        </button>
                        <button
                            onClick={() => setIsSignUp(true)}
                            className={`flex-1 py-2.5 px-4 rounded-full font-medium transition-all duration-200 ${isSignUp
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-neutral-400 hover:text-white'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Sign Up
                            </span>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleAuth} className="space-y-4">
                        {/* Email Input */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-neutral-800 border border-neutral-700 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-neutral-800 border border-neutral-700 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-6"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                isSignUp ? 'Create Account' : 'Sign In'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
