;; title: tosincode
;; version: 1.0.0
;; summary: A smart contract for the Tosincode project
;; description: This contract manages user profiles, achievements, and reputation system for Tosincode platform

;; traits
;;

;; token definitions
;;

;; constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_USER_NOT_FOUND (err u404))
(define-constant ERR_INVALID_INPUT (err u400))
(define-constant ERR_USER_EXISTS (err u409))

;; data vars
(define-data-var total-users uint u0)
(define-data-var platform-fee uint u100) ;; 1% fee in basis points

;; data maps
(define-map user-profiles
    { user: principal }
    {
        username: (string-ascii 50),
        reputation: uint,
        total-contributions: uint,
        join-date: uint,
        is-verified: bool
    }
)

(define-map user-achievements
    { user: principal, achievement-id: uint }
    {
        title: (string-ascii 100),
        description: (string-ascii 500),
        earned-date: uint,
        points: uint
    }
)

(define-map platform-stats
    { stat-key: (string-ascii 50) }
    { value: uint }
)

;; public functions

;; Create a new user profile
(define-public (create-profile (username (string-ascii 50)))
    (let (
        (user tx-sender)
        (current-block stacks-block-height)
    )
        (asserts! (is-none (map-get? user-profiles { user: user })) ERR_USER_EXISTS)
        (asserts! (> (len username) u0) ERR_INVALID_INPUT)
        
        (map-set user-profiles
            { user: user }
            {
                username: username,
                reputation: u0,
                total-contributions: u0,
                join-date: current-block,
                is-verified: false
            }
        )
        
        (var-set total-users (+ (var-get total-users) u1))
        (ok true)
    )
)

;; Update user reputation (only contract owner)
(define-public (update-reputation (user principal) (points uint))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
        (match (map-get? user-profiles { user: user })
            profile
            (begin
                (map-set user-profiles
                    { user: user }
                    (merge profile { reputation: (+ (get reputation profile) points) })
                )
                (ok true)
            )
            ERR_USER_NOT_FOUND
        )
    )
)

;; Add achievement to user
(define-public (add-achievement (user principal) (achievement-id uint) (title (string-ascii 100)) (description (string-ascii 500)) (points uint))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
        (asserts! (is-some (map-get? user-profiles { user: user })) ERR_USER_NOT_FOUND)
        
        (map-set user-achievements
            { user: user, achievement-id: achievement-id }
            {
                title: title,
                description: description,
                earned-date: stacks-block-height,
                points: points
            }
        )
        
        ;; Update user reputation
        (unwrap-panic (update-reputation user points))
        (ok true)
    )
)

;; Verify user (only contract owner)
(define-public (verify-user (user principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
        (match (map-get? user-profiles { user: user })
            profile
            (begin
                (map-set user-profiles
                    { user: user }
                    (merge profile { is-verified: true })
                )
                (ok true)
            )
            ERR_USER_NOT_FOUND
        )
    )
)

;; Update platform fee (only contract owner)
(define-public (set-platform-fee (new-fee uint))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
        (asserts! (<= new-fee u1000) ERR_INVALID_INPUT) ;; Max 10%
        (var-set platform-fee new-fee)
        (ok true)
    )
)

;; read only functions

;; Get user profile
(define-read-only (get-user-profile (user principal))
    (map-get? user-profiles { user: user })
)

;; Get user achievement
(define-read-only (get-user-achievement (user principal) (achievement-id uint))
    (map-get? user-achievements { user: user, achievement-id: achievement-id })
)

;; Get total users
(define-read-only (get-total-users)
    (var-get total-users)
)

;; Get platform fee
(define-read-only (get-platform-fee)
    (var-get platform-fee)
)

;; Get contract owner
(define-read-only (get-contract-owner)
    CONTRACT_OWNER
)

;; Check if user exists
(define-read-only (user-exists (user principal))
    (is-some (map-get? user-profiles { user: user }))
)

;; Get user reputation
(define-read-only (get-user-reputation (user principal))
    (match (map-get? user-profiles { user: user })
        profile (some (get reputation profile))
        none
    )
)

;; private functions

;; Helper function to validate string length
(define-private (is-valid-string (input (string-ascii 500)) (min-len uint) (max-len uint))
    (and (>= (len input) min-len) (<= (len input) max-len))
)
