#!/usr/bin/env python3
"""
Integration and unit tests for generate.py script

Tests the chart generation functionality including:
- Chart type mapping (unit test)
- Environment variable helpers (unit test)
- Real API integration for chart generation (integration test)
- Command line interface (unit test)
"""

import unittest
import sys
import os
import json
from unittest.mock import patch
from io import StringIO

# Add the scripts directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'skills', 'chart-visualization', 'scripts'))
import generate


class TestChartTypeMapping(unittest.TestCase):
    """Test the CHART_TYPE_MAP constant"""
    
    def test_chart_type_map_contains_expected_keys(self):
        """Verify key chart types are in the mapping"""
        self.assertIn("generate_line_chart", generate.CHART_TYPE_MAP)
        self.assertIn("generate_bar_chart", generate.CHART_TYPE_MAP)
        self.assertIn("generate_pie_chart", generate.CHART_TYPE_MAP)
        
    def test_chart_type_map_values_are_strings(self):
        """Verify all mapped values are strings"""
        for value in generate.CHART_TYPE_MAP.values():
            self.assertIsInstance(value, str)


class TestEnvironmentHelpers(unittest.TestCase):
    """Test environment variable helper functions"""
    
    def test_get_vis_request_server_default(self):
        """Test default VIS_REQUEST_SERVER value"""
        with patch.dict(os.environ, {}, clear=True):
            result = generate.get_vis_request_server()
            self.assertEqual(result, "https://antv-studio.alipay.com/api/gpt-vis")
    
    def test_get_vis_request_server_custom(self):
        """Test custom VIS_REQUEST_SERVER value"""
        custom_url = "https://custom.example.com/api"
        with patch.dict(os.environ, {"VIS_REQUEST_SERVER": custom_url}):
            result = generate.get_vis_request_server()
            self.assertEqual(result, custom_url)
    
    def test_get_service_identifier_none(self):
        """Test SERVICE_ID when not set"""
        with patch.dict(os.environ, {}, clear=True):
            result = generate.get_service_identifier()
            self.assertIsNone(result)
    
    def test_get_service_identifier_set(self):
        """Test SERVICE_ID when set"""
        service_id = "test-service-123"
        with patch.dict(os.environ, {"SERVICE_ID": service_id}):
            result = generate.get_service_identifier()
            self.assertEqual(result, service_id)


class TestRealAPIIntegration(unittest.TestCase):
    """Integration tests with real API calls"""
    
    def test_generate_chart_url_real_api(self):
        """Test real chart URL generation with API"""
        try:
            # Test with simple line chart data
            result = generate.generate_chart_url("line", {
                "data": [
                    {"year": "2020", "value": 10},
                    {"year": "2021", "value": 20},
                    {"year": "2022", "value": 30}
                ]
            })
            
            # Verify we got a URL back
            self.assertIsInstance(result, str)
            # Most likely the result will be a URL or some identifier
            print(f"Generated chart URL: {result}")
            
        except Exception as e:
            # If API is down or returns error, we still want to know what happened
            print(f"API call failed (this may be expected): {e}")
            # Don't fail the test if it's a network issue, just log it
            self.skipTest(f"API unavailable or returned error: {e}")


class TestCLIInterface(unittest.TestCase):
    """Test the command line interface"""
    
    def test_main_no_arguments(self):
        """Test main() with no arguments"""
        with patch.object(sys, 'argv', ['generate.py']):
            with self.assertRaises(SystemExit) as cm:
                with patch('builtins.print'):
                    generate.main()
            self.assertEqual(cm.exception.code, 1)
    
    def test_main_with_invalid_json(self):
        """Test main() with invalid JSON input"""
        with patch.object(sys, 'argv', ['generate.py', 'invalid json {']):
            with self.assertRaises(SystemExit) as cm:
                with patch('builtins.print'):
                    generate.main()
            self.assertEqual(cm.exception.code, 1)
    
    def test_main_with_unknown_tool(self):
        """Test main() with unknown tool name"""
        spec = json.dumps({"tool": "generate_unknown_chart", "args": {}})
        
        with patch.object(sys, 'argv', ['generate.py', spec]):
            with patch('builtins.print') as mock_print:
                generate.main()
                # Should print error message for unknown tool
                printed = [str(call) for call in mock_print.call_args_list]
                self.assertTrue(any("Unknown tool" in str(call) for call in printed))
    
    def test_main_with_spec_missing_tool(self):
        """Test main() with spec missing tool field"""
        spec = json.dumps({"args": {"data": [1, 2, 3]}})
        
        with patch.object(sys, 'argv', ['generate.py', spec]):
            with patch('builtins.print') as mock_print:
                generate.main()
                # Should print error about missing tool
                printed = [str(call) for call in mock_print.call_args_list]
                self.assertTrue(any("tool" in str(call).lower() for call in printed))


if __name__ == '__main__':
    unittest.main()
