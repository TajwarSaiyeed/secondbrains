import os
import glob
import re

dirs_to_scan = ['app', 'components', 'convex', 'inngest', 'hooks', 'lib']
files_to_clean = []

for d in dirs_to_scan:
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith('.ts') or f.endswith('.tsx') or f.endswith('.js') or f.endswith('.jsx'):
                files_to_clean.append(os.path.join(root, f))

ai_phrases = [
    r'// \d\.', r'// Note:', r'// NOTE:', r'// TODO:', r'// Server-side',
    r'// For now', r'// Allow Vercel', r'// Create an API', r'// 1\.', r'// 2\.',
    r'// 3\.', r'// 4\.', r'// Quick user', r'// Usually Convex', r'// Owner check',
    r'// Add user message', r'// Send chat context', r'// Use Convex', r'// Recommended',
    r'// safety cap', r'// 768 dimensions', r'// For safe insertion', r'// Protect private',
    r'// If undefined', r'// The person who', r'// The Board Owner', r'// Swap useAuth'
]

for filepath in files_to_clean:
    with open(filepath, 'r') as file:
        lines = file.readlines()
        
    new_lines = []
    modified = False
    for line in lines:
        stripped = line.strip()
        
        # Remove lines that are just comments we want to drop
        drop_line = False
        if stripped.startswith('//'):
            for p in ai_phrases:
                if re.search(p, stripped, re.IGNORECASE):
                    drop_line = True
                    break
            
            # Catch arbitrary AI-like heavy explanations
            if len(stripped.split()) > 8 and not drop_line:
                drop_line = True # Drop long explanatory comments
                
        if drop_line:
            modified = True
            continue
            
        # Clean inline comments
        if ' //' in line:
            for p in ai_phrases:
                if re.search(p, line, re.IGNORECASE):
                    line = line.split(' //')[0] + '\n'
                    modified = True
                    break
                    
        new_lines.append(line)
        
    if modified:
        with open(filepath, 'w') as file:
            file.writelines(new_lines)
            
print("Cleanup complete.")
