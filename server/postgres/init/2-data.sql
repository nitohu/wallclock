-- Add initial settings with password 'admin'
INSERT INTO settings (create_date, name, passwd, timezone, use_login_mask, dark_mode) VALUES (
    NOW(),
    'admin',
    '$2a$08$wLsQyNTcrcbqB18Pydq.zO6RZ13yDtfB2neGF5HZFLLATqWTMXjqK',
    'de_DE',
    1,
    1
)
