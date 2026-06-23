# Learnings

Non-obvious lessons discovered while building.

## Always have working software and working docs

Documentation must never outrun what actually works. The README is specced **first** (0001)
and every subsequent spec carries a "README updated" acceptance item, so docs and software
advance together. Forward-looking examples are allowed only when clearly labelled _(planned)_
— never presented as if they work today.

**Apply it:** when a build adds real capability, update the README (and these living docs) in
the same change to match reality. Don't leave aspirational snippets unmarked.
