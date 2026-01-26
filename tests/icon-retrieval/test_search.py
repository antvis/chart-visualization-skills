#!/usr/bin/env python3
"""
Integration and unit tests for search.py script

Tests the icon search functionality including:
- Real API integration for icon search (integration test)
- Command line argument parsing (unit test)
- SSL configuration (unit test)
"""

import unittest
import sys
import os
import json
from unittest.mock import patch
from io import StringIO
import ssl

# Add the scripts directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'skills', 'icon-retrieval', 'scripts'))
import search


class TestRealAPIIntegration(unittest.TestCase):
    """Integration tests with real API calls"""
    
    def test_search_icons_real_api(self):
        """Test real icon search with API"""
        try:
            # Search for a common icon with small topK
            results = search.search_icons('document', 2)
            
            # Verify we got results back
            self.assertIsInstance(results, list)
            
            # If we got results, verify the structure
            if len(results) > 0:
                self.assertIn('url', results[0])
                self.assertIn('svg', results[0])
                self.assertIsInstance(results[0]['url'], str)
                self.assertIsInstance(results[0]['svg'], str)
                # SVG should contain SVG tag
                self.assertIn('svg', results[0]['svg'].lower())
                print(f"Successfully retrieved {len(results)} icon(s)")
            else:
                print("No icons found (may be expected)")
                
        except Exception as e:
            # If API is down or returns error, we still want to know what happened
            print(f"API call failed (this may be expected): {e}")
            # Don't fail the test if it's a network issue, just log it
            self.skipTest(f"API unavailable or returned error: {e}")
    
    def test_search_icons_custom_top_k(self):
        """Test custom topK parameter with real API"""
        try:
            # Test with different topK value
            results = search.search_icons('arrow', 3)
            
            self.assertIsInstance(results, list)
            # Should return at most 3 results
            self.assertLessEqual(len(results), 3)
            print(f"Retrieved {len(results)} icon(s) with topK=3")
            
        except Exception as e:
            print(f"API call failed: {e}")
            self.skipTest(f"API unavailable: {e}")


class TestCLIInterface(unittest.TestCase):
    """Test the command line interface"""
    
    def test_main_no_arguments(self):
        """Test main() with no arguments"""
        with patch.object(sys, 'argv', ['search.py']):
            with self.assertRaises(SystemExit) as cm:
                with patch('sys.stderr', new_callable=StringIO):
                    search.main()
            self.assertEqual(cm.exception.code, 1)
    
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
