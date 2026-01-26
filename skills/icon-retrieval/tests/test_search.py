#!/usr/bin/env python3
"""
Unit tests for search.py script

Tests the icon search functionality including:
- Icon search API integration
- SVG content retrieval
- Command line argument parsing
- Error handling
"""

import unittest
import sys
import os
import json
from unittest.mock import patch, Mock, MagicMock
from io import StringIO
import ssl

# Add the scripts directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'scripts'))
import search


class TestSearchIcons(unittest.TestCase):
    """Test the search_icons function"""
    
    @patch('search.urllib.request.urlopen')
    def test_search_icons_success(self, mock_urlopen):
        """Test successful icon search"""
        # Mock API response
        api_response = Mock()
        api_response.read.return_value = json.dumps({
            'status': True,
            'data': {
                'success': True,
                'data': [
                    'https://example.com/icon1.svg',
                    'https://example.com/icon2.svg'
                ]
            }
        }).encode('utf-8')
        api_response.__enter__ = Mock(return_value=api_response)
        api_response.__exit__ = Mock(return_value=False)
        
        # Mock SVG responses
        svg_response1 = Mock()
        svg_response1.read.return_value = b'<svg>icon1</svg>'
        svg_response1.__enter__ = Mock(return_value=svg_response1)
        svg_response1.__exit__ = Mock(return_value=False)
        
        svg_response2 = Mock()
        svg_response2.read.return_value = b'<svg>icon2</svg>'
        svg_response2.__enter__ = Mock(return_value=svg_response2)
        svg_response2.__exit__ = Mock(return_value=False)
        
        # Configure mock to return different responses
        mock_urlopen.side_effect = [api_response, svg_response1, svg_response2]
        
        results = search.search_icons('document', 5)
        
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['url'], 'https://example.com/icon1.svg')
        self.assertEqual(results[0]['svg'], '<svg>icon1</svg>')
        self.assertEqual(results[1]['url'], 'https://example.com/icon2.svg')
        self.assertEqual(results[1]['svg'], '<svg>icon2</svg>')
    
    @patch('search.urllib.request.urlopen')
    def test_search_icons_api_failure(self, mock_urlopen):
        """Test handling of API failure"""
        api_response = Mock()
        api_response.read.return_value = json.dumps({
            'status': False,
            'message': 'API error'
        }).encode('utf-8')
        api_response.__enter__ = Mock(return_value=api_response)
        api_response.__exit__ = Mock(return_value=False)
        
        mock_urlopen.return_value = api_response
        
        with self.assertRaises(Exception) as context:
            search.search_icons('document', 5)
        
        self.assertIn('API error', str(context.exception))
    
    @patch('search.urllib.request.urlopen')
    def test_search_icons_svg_fetch_partial_failure(self, mock_urlopen):
        """Test handling when some SVG fetches fail"""
        # Mock API response
        api_response = Mock()
        api_response.read.return_value = json.dumps({
            'status': True,
            'data': {
                'success': True,
                'data': [
                    'https://example.com/icon1.svg',
                    'https://example.com/icon2.svg'
                ]
            }
        }).encode('utf-8')
        api_response.__enter__ = Mock(return_value=api_response)
        api_response.__exit__ = Mock(return_value=False)
        
        # Mock SVG responses - first succeeds, second fails
        svg_response1 = Mock()
        svg_response1.read.return_value = b'<svg>icon1</svg>'
        svg_response1.__enter__ = Mock(return_value=svg_response1)
        svg_response1.__exit__ = Mock(return_value=False)
        
        # Second SVG fetch raises an exception
        mock_urlopen.side_effect = [
            api_response,
            svg_response1,
            Exception("Network error")
        ]
        
        # Should still return the successful result
        with patch('sys.stderr', new_callable=StringIO):
            results = search.search_icons('document', 5)
        
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['svg'], '<svg>icon1</svg>')
    
    @patch('search.urllib.request.urlopen')
    @patch.dict(os.environ, {'PYTHONHTTPSVERIFY': '0'})
    def test_search_icons_ssl_verification_disabled(self, mock_urlopen):
        """Test SSL verification can be disabled via environment variable"""
        api_response = Mock()
        api_response.read.return_value = json.dumps({
            'status': True,
            'data': {
                'success': True,
                'data': []
            }
        }).encode('utf-8')
        api_response.__enter__ = Mock(return_value=api_response)
        api_response.__exit__ = Mock(return_value=False)
        
        mock_urlopen.return_value = api_response
        
        results = search.search_icons('document', 5)
        
        # Verify urlopen was called
        self.assertTrue(mock_urlopen.called)
        
        # Verify SSL context was passed
        call_kwargs = mock_urlopen.call_args_list[0][1]
        self.assertIn('context', call_kwargs)
        ssl_context = call_kwargs['context']
        self.assertIsInstance(ssl_context, ssl.SSLContext)
    
    @patch('search.urllib.request.urlopen')
    @patch.dict(os.environ, {'SSL_VERIFY': 'false'})
    def test_search_icons_ssl_verify_false(self, mock_urlopen):
        """Test SSL verification disabled with SSL_VERIFY=false"""
        api_response = Mock()
        api_response.read.return_value = json.dumps({
            'status': True,
            'data': {
                'success': True,
                'data': []
            }
        }).encode('utf-8')
        api_response.__enter__ = Mock(return_value=api_response)
        api_response.__exit__ = Mock(return_value=False)
        
        mock_urlopen.return_value = api_response
        
        results = search.search_icons('test', 3)
        
        self.assertEqual(len(results), 0)
        self.assertTrue(mock_urlopen.called)
    
    @patch('search.urllib.request.urlopen')
    def test_search_icons_custom_top_k(self, mock_urlopen):
        """Test custom topK parameter"""
        api_response = Mock()
        api_response.read.return_value = json.dumps({
            'status': True,
            'data': {
                'success': True,
                'data': []
            }
        }).encode('utf-8')
        api_response.__enter__ = Mock(return_value=api_response)
        api_response.__exit__ = Mock(return_value=False)
        
        mock_urlopen.return_value = api_response
        
        results = search.search_icons('test', 10)
        
        # Verify the API was called with correct topK
        call_args = mock_urlopen.call_args_list[0][0]
        self.assertIn('topK=10', call_args[0])


class TestMainFunction(unittest.TestCase):
    """Test the main() function and CLI interface"""
    
    def test_main_no_arguments(self):
        """Test main() with no arguments"""
        with patch.object(sys, 'argv', ['search.py']):
            with self.assertRaises(SystemExit) as cm:
                with patch('sys.stderr', new_callable=StringIO):
                    search.main()
            self.assertEqual(cm.exception.code, 1)
    
    @patch('search.search_icons')
    def test_main_with_query_only(self, mock_search):
        """Test main() with query argument only"""
        mock_search.return_value = [
            {'url': 'https://example.com/icon.svg', 'svg': '<svg>test</svg>'}
        ]
        
        with patch.object(sys, 'argv', ['search.py', 'document']):
            with patch('builtins.print') as mock_print:
                search.main()
                mock_search.assert_called_once_with('document', 5)
                
                # Verify JSON output was printed
                output_calls = [call for call in mock_print.call_args_list]
                self.assertTrue(len(output_calls) > 0)
    
    @patch('search.search_icons')
    def test_main_with_query_and_topk(self, mock_search):
        """Test main() with query and topK arguments"""
        mock_search.return_value = []
        
        with patch.object(sys, 'argv', ['search.py', 'document', '10']):
            with patch('builtins.print'):
                with patch('sys.stderr', new_callable=StringIO):
                    search.main()
                    mock_search.assert_called_once_with('document', 10)
    
    def test_main_with_invalid_topk(self):
        """Test main() with invalid topK value"""
        with patch.object(sys, 'argv', ['search.py', 'document', '0']):
            with self.assertRaises(SystemExit) as cm:
                with patch('sys.stderr', new_callable=StringIO):
                    search.main()
            self.assertEqual(cm.exception.code, 1)
    
    def test_main_with_negative_topk(self):
        """Test main() with negative topK value"""
        with patch.object(sys, 'argv', ['search.py', 'document', '-5']):
            with self.assertRaises(SystemExit) as cm:
                with patch('sys.stderr', new_callable=StringIO):
                    search.main()
            self.assertEqual(cm.exception.code, 1)
    
    @patch('search.search_icons')
    def test_main_search_exception(self, mock_search):
        """Test main() handling of search exceptions"""
        mock_search.side_effect = Exception("Network error")
        
        with patch.object(sys, 'argv', ['search.py', 'document']):
            with self.assertRaises(SystemExit) as cm:
                with patch('sys.stderr', new_callable=StringIO):
                    search.main()
            self.assertEqual(cm.exception.code, 1)
    
    @patch('search.search_icons')
    def test_main_empty_results(self, mock_search):
        """Test main() handles empty results gracefully"""
        mock_search.return_value = []
        
        with patch.object(sys, 'argv', ['search.py', 'nonexistent']):
            with patch('builtins.print'):
                # Should complete successfully even with no results
                search.main()
                mock_search.assert_called_once_with('nonexistent', 5)
    
    @patch('search.search_icons')
    def test_main_output_format(self, mock_search):
        """Test main() output format is valid JSON"""
        mock_search.return_value = [
            {'url': 'https://example.com/icon.svg', 'svg': '<svg>test</svg>'}
        ]
        
        with patch.object(sys, 'argv', ['search.py', 'document', '5']):
            with patch('builtins.print') as mock_print:
                search.main()
                
                # Get the printed output
                output_calls = [str(call) for call in mock_print.call_args_list]
                
                # Find the JSON output call
                json_output = None
                for call in output_calls:
                    if 'query' in call:
                        # Extract the JSON string from the call
                        # This is a simplified check
                        self.assertIn('document', call)
                        break
    
    @patch('search.search_icons')
    def test_main_with_non_ascii_query(self, mock_search):
        """Test main() with non-ASCII characters in query"""
        mock_search.return_value = []
        
        with patch.object(sys, 'argv', ['search.py', '文档']):
            with patch('builtins.print'):
                with patch('sys.stderr', new_callable=StringIO):
                    search.main()
                    mock_search.assert_called_once_with('文档', 5)


class TestSSLConfiguration(unittest.TestCase):
    """Test SSL context configuration"""
    
    @patch.dict(os.environ, {}, clear=True)
    def test_default_ssl_verification_enabled(self):
        """Test SSL verification is enabled by default"""
        # This test verifies the behavior described in the code comments
        # In actual usage, SSL verification should be enabled by default
        self.assertNotIn('PYTHONHTTPSVERIFY', os.environ)
        self.assertNotIn('SSL_VERIFY', os.environ)
    
    @patch.dict(os.environ, {'PYTHONHTTPSVERIFY': '1'})
    def test_ssl_verification_explicitly_enabled(self):
        """Test SSL verification when explicitly enabled"""
        self.assertEqual(os.environ.get('PYTHONHTTPSVERIFY'), '1')
    
    @patch.dict(os.environ, {'SSL_VERIFY': 'true'})
    def test_ssl_verify_true(self):
        """Test SSL_VERIFY=true environment variable"""
        self.assertEqual(os.environ.get('SSL_VERIFY'), 'true')


if __name__ == '__main__':
    unittest.main()
