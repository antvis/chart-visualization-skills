#!/usr/bin/env python3
"""
Unit tests for generate.py script

Tests the chart generation functionality including:
- Chart type mapping
- URL generation for charts
- Map generation
- Error handling
- Command line interface
"""

import unittest
import sys
import os
import json
from unittest.mock import patch, Mock, mock_open
from io import StringIO

# Add the scripts directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
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


class TestGenerateChartUrl(unittest.TestCase):
    """Test the generate_chart_url function"""
    
    @patch('generate.requests.post')
    def test_generate_chart_url_success(self, mock_post):
        """Test successful chart URL generation"""
        mock_response = Mock()
        mock_response.json.return_value = {
            "success": True,
            "resultObj": "https://example.com/chart/123"
        }
        mock_post.return_value = mock_response
        
        result = generate.generate_chart_url("line", {"data": [1, 2, 3]})
        
        self.assertEqual(result, "https://example.com/chart/123")
        mock_post.assert_called_once()
        
        # Verify payload structure
        call_args = mock_post.call_args
        payload = call_args[1]['json']
        self.assertEqual(payload['type'], "line")
        self.assertEqual(payload['source'], "chart-visualization-creator")
        self.assertEqual(payload['data'], [1, 2, 3])
    
    @patch('generate.requests.post')
    def test_generate_chart_url_api_error(self, mock_post):
        """Test handling of API error response"""
        mock_response = Mock()
        mock_response.json.return_value = {
            "success": False,
            "errorMessage": "Invalid chart type"
        }
        mock_post.return_value = mock_response
        
        with self.assertRaises(Exception) as context:
            generate.generate_chart_url("invalid", {})
        
        self.assertIn("Invalid chart type", str(context.exception))
    
    @patch('generate.requests.post')
    def test_generate_chart_url_http_error(self, mock_post):
        """Test handling of HTTP errors"""
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = Exception("HTTP 500")
        mock_post.return_value = mock_response
        
        with self.assertRaises(Exception):
            generate.generate_chart_url("line", {})


class TestGenerateMap(unittest.TestCase):
    """Test the generate_map function"""
    
    @patch('generate.get_service_identifier')
    @patch('generate.requests.post')
    def test_generate_map_success(self, mock_post, mock_service_id):
        """Test successful map generation"""
        mock_service_id.return_value = "service-123"
        mock_response = Mock()
        mock_response.json.return_value = {
            "success": True,
            "resultObj": {"map": "data"}
        }
        mock_post.return_value = mock_response
        
        result = generate.generate_map("generate_district_map", {"region": "beijing"})
        
        self.assertEqual(result, {"map": "data"})
        mock_post.assert_called_once()
        
        # Verify payload structure
        call_args = mock_post.call_args
        payload = call_args[1]['json']
        self.assertEqual(payload['tool'], "generate_district_map")
        self.assertEqual(payload['serviceId'], "service-123")
        self.assertEqual(payload['source'], "chart-visualization-creator")
    
    @patch('generate.get_service_identifier')
    @patch('generate.requests.post')
    def test_generate_map_api_error(self, mock_post, mock_service_id):
        """Test handling of map generation API error"""
        mock_service_id.return_value = "service-123"
        mock_response = Mock()
        mock_response.json.return_value = {
            "success": False,
            "errorMessage": "Invalid region"
        }
        mock_post.return_value = mock_response
        
        with self.assertRaises(Exception) as context:
            generate.generate_map("generate_district_map", {"region": "invalid"})
        
        self.assertIn("Invalid region", str(context.exception))


class TestMainFunction(unittest.TestCase):
    """Test the main() function and CLI interface"""
    
    def test_main_no_arguments(self):
        """Test main() with no arguments"""
        with patch.object(sys, 'argv', ['generate.py']):
            with self.assertRaises(SystemExit) as cm:
                with patch('builtins.print'):
                    generate.main()
            self.assertEqual(cm.exception.code, 1)
    
    @patch('generate.generate_chart_url')
    def test_main_with_json_string(self, mock_generate):
        """Test main() with JSON string input"""
        mock_generate.return_value = "https://example.com/chart"
        
        spec = json.dumps({
            "tool": "generate_line_chart",
            "args": {"data": [1, 2, 3]}
        })
        
        with patch.object(sys, 'argv', ['generate.py', spec]):
            with patch('builtins.print') as mock_print:
                generate.main()
                mock_generate.assert_called_once()
                # Check that URL was printed
                self.assertTrue(any('https://example.com/chart' in str(call) 
                                  for call in mock_print.call_args_list))
    
    @patch('generate.generate_chart_url')
    @patch('builtins.open', new_callable=mock_open, read_data='{"tool": "generate_bar_chart", "args": {}}')
    @patch('os.path.isfile')
    def test_main_with_file_input(self, mock_isfile, mock_file, mock_generate):
        """Test main() with file input"""
        mock_isfile.return_value = True
        mock_generate.return_value = "https://example.com/chart"
        
        with patch.object(sys, 'argv', ['generate.py', '/tmp/test.json']):
            with patch('builtins.print'):
                generate.main()
                mock_generate.assert_called_once()
    
    @patch('generate.generate_chart_url')
    def test_main_with_list_of_specs(self, mock_generate):
        """Test main() with multiple chart specs"""
        mock_generate.return_value = "https://example.com/chart"
        
        specs = json.dumps([
            {"tool": "generate_line_chart", "args": {}},
            {"tool": "generate_bar_chart", "args": {}}
        ])
        
        with patch.object(sys, 'argv', ['generate.py', specs]):
            with patch('builtins.print'):
                generate.main()
                # Should be called twice, once for each spec
                self.assertEqual(mock_generate.call_count, 2)
    
    def test_main_with_unknown_tool(self):
        """Test main() with unknown tool name"""
        spec = json.dumps({"tool": "generate_unknown_chart", "args": {}})
        
        with patch.object(sys, 'argv', ['generate.py', spec]):
            with patch('builtins.print') as mock_print:
                generate.main()
                # Should print error message for unknown tool
                printed = [str(call) for call in mock_print.call_args_list]
                self.assertTrue(any("Unknown tool" in str(call) for call in printed))
    
    @patch('generate.generate_map')
    def test_main_with_map_chart(self, mock_generate_map):
        """Test main() with map chart type"""
        mock_generate_map.return_value = {
            "content": [
                {"type": "text", "text": "https://example.com/map"}
            ]
        }
        
        spec = json.dumps({"tool": "generate_district_map", "args": {}})
        
        with patch.object(sys, 'argv', ['generate.py', spec]):
            with patch('builtins.print') as mock_print:
                generate.main()
                mock_generate_map.assert_called_once()
                # Check that map URL was printed
                printed = [str(call) for call in mock_print.call_args_list]
                self.assertTrue(any("https://example.com/map" in str(call) for call in printed))
    
    def test_main_with_invalid_json(self):
        """Test main() with invalid JSON input"""
        with patch.object(sys, 'argv', ['generate.py', 'invalid json {']):
            with self.assertRaises(SystemExit) as cm:
                with patch('builtins.print'):
                    generate.main()
            self.assertEqual(cm.exception.code, 1)
    
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
