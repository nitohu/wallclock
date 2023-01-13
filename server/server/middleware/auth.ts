const auth = async (req: any, res: any, next: any) => {
    req.authenticated = false
    if (req.session && req.session.authenticated && req.session.settings) {
        req.authenticated = true
        return next()
    }

    // User is not authenticated
    return res.redirect("/login")
}

export default auth
