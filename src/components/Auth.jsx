import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
                <h1 className="text-3xl font-bold mb-6 text-center text-red-500">Kanto Tracker</h1>
                <p className="mb-4 text-center text-gray-400">
                    {isSignUp ? 'Sign up to start tracking' : 'Sign in to your collection'}
                </p>
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <input
                            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-red-500 focus:outline-none"
                            type="email"
                            placeholder="Your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <input
                            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-red-500 focus:outline-none"
                            type="password"
                            placeholder="Your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        className="w-full p-3 rounded bg-red-600 hover:bg-red-700 font-bold transition-colors disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-gray-400 hover:text-white underline"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    )
}
