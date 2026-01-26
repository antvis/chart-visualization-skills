#!/usr/bin/env python3

"""
Icon Search Script
Searches for icons by keywords and retrieves their SVG strings

Usage: python search.py '<search_query>' [topK]
Example: python search.py 'document'
Example: python search.py 'document' 10
"""

import sys
import json
import urllib.request
import urllib.parse
import ssl
import os


def search_icons(query, top_k=5):
    """Search for icons and retrieve their SVG content"""
    # Build API URL
    params = urllib.parse.urlencode({'text': query, 'topK': top_k})
    api_url = f'https://www.weavefox.cn/api/open/v1/icon?{params}'
    
    # Create SSL context
    # By default, uses standard certificate verification
    # Set PYTHONHTTPSVERIFY=0 or SSL_VERIFY=false environment variable to disable verification
    # if encountering certificate issues
    ssl_context = ssl.create_default_context()
    
    # Allow disabling SSL verification via environment variable for troubleshooting
    # This should only be used in development or when certificate issues are unavoidable
    if os.environ.get('PYTHONHTTPSVERIFY', '1') == '0' or os.environ.get('SSL_VERIFY', '').lower() == 'false':
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
    
    # Fetch icon URLs
    with urllib.request.urlopen(api_url, context=ssl_context) as response:
        data = json.loads(response.read())
    
    if not data.get('status') or not data.get('data', {}).get('success'):
        raise Exception(data.get('message', 'API request failed'))
    
    icon_urls = data['data']['data']
    
    # Fetch SVG content for each icon
    results = []
    for url in icon_urls:
        try:
            with urllib.request.urlopen(url, context=ssl_context) as svg_response:
                svg_content = svg_response.read().decode('utf-8')
                results.append({
                    'url': url,
                    'svg': svg_content
                })
        except Exception as e:
            print(f'Warning: Failed to fetch SVG from {url}: {e}', file=sys.stderr)
    
    return results


def main():
    # Parse arguments
    if len(sys.argv) < 2:
        error = {
            'error': 'Missing search query',
            'usage': 'python search.py \'<search_query>\' [topK]',
            'example': 'python search.py \'document\' 10',
            'note': 'topK defaults to 5 if not specified'
        }
        print(json.dumps(error, indent=2), file=sys.stderr)
        sys.exit(1)
    
    query = sys.argv[1]
    top_k = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    if top_k < 1:
        error = {
            'error': 'Invalid topK value',
            'usage': 'python search.py \'<search_query>\' [topK]',
            'note': 'topK must be a positive integer'
        }
        print(json.dumps(error, indent=2), file=sys.stderr)
        sys.exit(1)
    
    try:
        results = search_icons(query, top_k)
        output = {
            'query': query,
            'topK': top_k,
            'count': len(results),
            'results': results
        }
        print(json.dumps(output, indent=2, ensure_ascii=False))
        
        if len(results) == 0:
            print(f'Warning: No icons found for query "{query}"', file=sys.stderr)
    except Exception as e:
        error = {'error': str(e), 'query': query}
        print(json.dumps(error, indent=2), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
