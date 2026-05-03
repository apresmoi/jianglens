# Schemas

The first implementation keeps schemas lightweight and file-native. The key enforced contracts are:

- source refs include manifestation/text version and segment or paragraph ID
- content IDs are unique across frontmatter-bearing files
- generated indexes are reproducible
- canonical claims eventually cite evidence records

Reference source refs:

```text
video:<manifestation-id>@transcript:v<version>#seg-0001
article:<article-id>@text:v<version>#p-0001
interview:<interview-id>@transcript:v<version>#seg-0001
```
