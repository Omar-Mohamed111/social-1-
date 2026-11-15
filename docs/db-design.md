## db-design

## User

- id
- userName
- email
- password
- phoneNumber
- gender
- provider
- created at
- updated at
- isDeleted

## Post

- id
- content
- userId
- created at
- updated at
- isDeleted
- commentsCounts
- reactionCounts
- allowComments Boolean

## Comments / Reply

- id
- content
- userId
- postId
- parentId
- reactionCounts
- created at
- updated at

## Reactions

- id
- userId
- refId [postId,commentId]
- model ["Post","Comment"]
- type ENUM("like", "love", "care" , "angry")
- created at
- updated at


