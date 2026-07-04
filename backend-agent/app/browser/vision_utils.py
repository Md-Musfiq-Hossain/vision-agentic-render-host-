class CoordinateScaler:
    @staticmethod
    def normalize_to_vlm_grid(absolute_x: float, absolute_y: float, viewport_width: int, viewport_height: int) -> list:
        """
        Maps standard screen pixel coordinates into a normalized [0, 1000] integer grid
        for Vision-Language Model box tracking.
        """
        normalized_x = int((absolute_x / viewport_width) * 1000)
        normalized_y = int((absolute_y / viewport_height) * 1000)
        return [normalized_y, normalized_x] # Standard [ymin, xmin] representation

    @staticmethod
    def denormalize_from_vlm_grid(normalized_x: float, normalized_y: float, viewport_width: int, viewport_height: int) -> dict:
        """
        Translates a 0-1000 float or integer model output point back to absolute 
        clickable browser viewport pixels.
        """
        absolute_x = round((normalized_x / 1000.0) * viewport_width)
        absolute_y = round((normalized_y / 1000.0) * viewport_height)
        return {"x": absolute_x, "y": absolute_y}