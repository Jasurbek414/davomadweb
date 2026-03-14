from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'success': False,
            'status_code': response.status_code,
            'errors': response.data,
        }
        # Flatten detail messages
        if isinstance(response.data, dict) and 'detail' in response.data:
            error_data['message'] = str(response.data['detail'])
        elif isinstance(response.data, list):
            error_data['message'] = str(response.data[0]) if response.data else 'Xatolik'
        else:
            error_data['message'] = 'Xatolik yuz berdi'
        response.data = error_data

    return response
