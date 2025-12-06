import { useEffect, useRef } from 'react'

export function useModalBack(isOpen, onClose) {
    const isBackNavigation = useRef(false)
    const pushedState = useRef(false)

    useEffect(() => {
        if (isOpen) {
            const originalStyle = window.getComputedStyle(document.body).overflow
            document.body.style.overflow = 'hidden'

            isBackNavigation.current = false
            pushedState.current = false

            const handlePopState = () => {
                // User pressed back button
                isBackNavigation.current = true
                onClose()
            }

            // Delay adding listener to avoid Strict Mode double-mount issue and ensure state is pushed
            const timer = setTimeout(() => {
                window.history.pushState(null, '', window.location.href)
                pushedState.current = true
                window.addEventListener('popstate', handlePopState)
            }, 50)

            return () => {
                document.body.style.overflow = originalStyle
                clearTimeout(timer)
                window.removeEventListener('popstate', handlePopState)

                // If closed manually (not by back button), remove the history state we pushed
                if (!isBackNavigation.current && pushedState.current) {
                    window.history.back()
                }
            }
        }
    }, [isOpen, onClose])
}
