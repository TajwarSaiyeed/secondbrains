import re

with open('components/discussions/discussion-messages.tsx', 'r') as f:
    text = f.read()

# Imports
text = re.sub(
    r'(import { Bot, Link )',
    r'import { Input } from "@/components/ui/input";\nimport { Search, Bot, Link ',
    text
)

# Insert state
state_insertion = '''  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch real-time messages from Convex
  const defaultMessages = useQuery(api.discussions.getMessages, {
    boardId: boardId as Id<"boards">,
  });

  const searchResults = useQuery(
    api.discussions.searchMessages,
    debouncedSearchQuery.trim() !== ""
      ? { boardId: boardId as Id<"boards">, searchQuery: debouncedSearchQuery }
      : "skip"
  );

  const messages = debouncedSearchQuery.trim() !== "" ? searchResults : defaultMessages;'''

text = text.replace(
'''  // Fetch real-time messages from Convex
  const messages = useQuery(api.discussions.getMessages, {
    boardId: boardId as Id<"boards">,
  });''', state_insertion)

# Insert the search bar UI inside the render
ui_insertion = '''    return (
      <div className="flex-1 overflow-hidden flex flex-col pt-[64px]">
        <div className="p-3 border-b flex items-center justify-between bg-muted/30">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-8 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">'''

text = text.replace(
'''    return (
      <div className="flex-1 overflow-hidden flex flex-col pt-[64px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">''', ui_insertion)

with open('components/discussions/discussion-messages.tsx', 'w') as f:
    f.write(text)
